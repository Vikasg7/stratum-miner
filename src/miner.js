const { join, map, concat,
        take, reduce, nth } = require("ramda")
const { toBytesLE, report, toHexLE, pickIdxs,
        toBytes, scryptHash, lessThanEq, 
        sha256d, splitNumToRanges, toHex } = require("./utils")
const Rx = require("rxjs")
const RxOp = require("rxjs/operators")
const crypto = require("crypto")
const url = require("url")
const Stratum = require("./stratum")

// Calculation of merkel root is different for stratum
// https://bitcoin.stackexchange.com/a/20885/123460
const merkleLeaves = (a, b) => 
   concat(a, b) |> sha256d

const merkleRoot = (txs, cbTxId) =>
   reduce(merkleLeaves, cbTxId, txs)

const blockHeader = (blockInfo, extraNonce2) => {
   const [ extraNonce1
         , extraNonce2Size
         , jobId
         , prevHash
         , coinb1
         , coinb2
         , merkleBranch
         , version
         , nbits
         , ntime
         , cleanJobs
         , target
         ] = blockInfo

   const cbTxId = sha256d(coinb1 + extraNonce1 + extraNonce2 + coinb2)
   const merkelRoot = merkleRoot(merkleBranch, cbTxId)

   const header = 
      [ version
      , prevHash
      , merkelRoot
      , ntime
      , nbits
      , "00000000" // Placeholder nonce
      ]

   return header |> map(toHexLE(?, "hex"))
}

const MAX_NONCE = 2 ** 32

const mineBlock = (args, blockInfo) => {
   const { threads, user } = args
   const [ extraNonce2Size
         , jobId
         , ntime
         , targetHex
         ] = blockInfo
             |> pickIdxs([1, 2, 9, 11])

   const extraNonce2 = 
      crypto.randomBytes(extraNonce2Size)
      |> toHex
   
   const headBytes = 
      blockHeader(blockInfo, extraNonce2)
      |> take(5)
      |> join("")
      |> toBytes(?, "hex")

   const target = toBytes(targetHex, "hex")

   const isGolden = (nonce) =>
      [headBytes, toBytesLE(nonce, "u32")]
      |> Buffer.concat
      |> scryptHash
      |> ((hash) => lessThanEq(hash, target) ? [nonce] : [])

   const findGoldenNonce = ([f, t]) =>
      Rx.range(f, t - f, Rx.asyncScheduler)
      |> RxOp.mergeMap(isGolden)

   // following should be big endian
   // https://github.com/slush0/stratum-mining/blob/b2a24d7424784cada95010232cdb79cfed481da6/mining/service.py#L136-L140
   const blockResp = (nonce) => 
      [ user
      , jobId
      , extraNonce2
      , ntime
      , toHex(nonce, "u32")
      ]

   return Rx.from(splitNumToRanges(MAX_NONCE, threads))
          |> RxOp.mergeMap(findGoldenNonce)
          |> RxOp.take(1)
          |> RxOp.tap(report("nonce", ?))
          |> RxOp.map(blockResp)
}

const reportJobId = (blockInfo) =>
   report("jobId", nth(2, blockInfo))

const main = (args) => {
   const { id, user, pass, address } = args
   const { hostname: host, port } = new url.URL(address)
   const stratum = Stratum({host, port, id, user, pass})
   return stratum.blockInfo
          |> RxOp.tap(reportJobId)
          |> RxOp.switchMap(mineBlock(args, ?))
          |> RxOp.mergeMap(stratum.submit)
          |> RxOp.tap(report(["result", "error"], ?))
          |> RxOp.finalize(stratum.close)
}

module.exports = {
   merkleLeaves,
   merkleRoot,
   blockHeader,
   mineBlock,
   main
}