const { createHash, scryptSync } = require("crypto")
const { is, range, concat, map, multiply, join,
        has, splitEvery, apply, zip, update,
        not, curry, pick, values, reverse } = require("ramda")
const { log } = require("console")
const Rx = require("rxjs")
const RxOp = require("rxjs/operators")

const sha256 = (input) =>
   createHash("sha256")
      .update(input, "hex")
      .digest("hex")

const sha256d = (input) =>
   input
   |> sha256
   |> sha256

// https://litecoin.info/index.php/Scrypt
const scryptHash = (bytes) =>
   scryptSync(bytes, bytes, 32, { N: 1024, r: 1, p: 1 })
   |> toBytesBE

const uIntToBytes = (num, size, method, endianess = "") => {
   const buf = Buffer.allocUnsafe(size) 
   buf[method + (size * 8) + endianess](num, 0)
   return buf
}

const toBytes = (data, type) =>
   type == "hex" ? Buffer.from(data, "hex") :
   type == "u8"  ? uIntToBytes(data, 1, "writeUInt") :
   type == "u16" ? uIntToBytes(data, 2, "writeUInt", "BE") :
   type == "u32" ? uIntToBytes(data, 4, "writeUInt", "BE") :
   type == "u64" ? uIntToBytes(BigInt(data), 8, "writeBigUInt", "BE")
                 : Buffer.from(data, type)

const toHex = (data, type) =>
   is(Buffer, data) 
      ? data.toString("hex")
      : toBytes(data, type) |> toHex 

const toBytesLE = (data, type) => 
   is(Buffer, data)
      ? data.reverse()
      : toBytes(data, type).reverse()

const toHexLE = (data, type) =>
   toBytesLE(data, type)
   |> toHex

const toBytesBE = toBytesLE
const toHexBE = toHexLE

const pprint = (json) => JSON.stringify(json, null, 2)

const splitNumToRanges = (num, divBy) => 
   concat(range(0, divBy), range(1, divBy + 1))
   |> map(multiply(?, Math.ceil(num / divBy)))
   |> update(-1, num)
   |> splitEvery(divBy)
   |> apply(zip)
   
const isObject = (value) =>
   typeof value === "object"   &&
   typeof value !== "function" &&
   not(Array.isArray(value))   &&
   value !== null

const report = (k, v) =>
   Array.isArray(k) ? k.forEach(report(?, v)) :
   isObject(v)      ? log(`${k} : ${v[k.trim()]}`)
                    : log(`${k} : ${v}`)

const lessThanEq = (a, b) => {
   for (let i = 0; i < a.length; i++) {
      let x = a[i]
      let y = b[i]
      if (x == y) continue;
      return x < y ? true : false
   }
   return true
}

// https://github.com/atomminer/atomminer-core/blob/4df5711d3e9dbe271ba2a00de784b1e1784e0f4d/src/utils/diff.js
const diffToTarget = (diff) => {
   let k = 6
   for (; k > 0 && diff > 1.0; k--) {
      diff /= 4294967296.0
   }
   const m = 
      (4.294901760e+9 / diff)
      |> Math.ceil
      |> BigInt
   const buf = Buffer.alloc(32)
   buf.writeUInt32LE(Number(0xffffffffn & m) >>> 0, k << 2)
   buf.writeUInt32LE(Number(m >> 32n) >>> 0, 4 + (k << 2))
   return buf.reverse().toString('hex')
}

const notHave = (key) => (mp) => not(has(key, mp))

const repeatOn = (notifier) => (source) =>
   source
   |> RxOp.takeUntil(notifier)
   |> RxOp.repeat()

// the Original implementations didn't workout for me.
const bindCb = (fn) => (...args) =>
   new Rx.Observable((subs) => {
      fn(...args, (result) => {
         subs.next(result)
         subs.complete()
      })
   })

const bindNodeCb = (fn) => (...args) =>
   new Rx.Observable((subs) => {
      fn(...args, (error, result) => {
         if (error) {
            subs.error(error)
         } else {
            subs.next(result)
            subs.complete()
         }
      })
   })

const pickIdxs = (idxs, list) =>
   pick(idxs, list)
   |> values

const fourByteReverse = (hex) =>
   splitEvery(8, hex)
   |> reverse
   |> join("")

module.exports = {
   sha256,
   sha256d,
   scryptHash,
   toBytes,
   toHex,
   toBytesLE,
   toBytesBE,
   toHexBE,
   toHexLE,
   pprint,
   splitNumToRanges,
   isObject,
   report,
   lessThanEq,
   diffToTarget,
   notHave,
   repeatOn,
   bindCb,
   bindNodeCb,
   pickIdxs: curry(pickIdxs),
   fourByteReverse
}