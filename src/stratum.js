const net = require("net")
const { has, prop, concat, propEq,
        nth, last, unnest } = require("ramda")
const Rx = require("rxjs")
const RxOp = require("rxjs/operators")
const { diffToTarget, notHave, repeatOn, pickIdxs,
        bindCallback, bindNodeCallback } = require("./utils")

const Stratum = (config) => {
   const { id, user, pass, host, port } = config

   const socket = new net.Socket() 

   const socketError =
      Rx.fromEvent(socket, "error")
      |> RxOp.take(1)

   let unused = ""
   const parseMsgs = (data) => {
      const parts = (unused + data).split("\n")
      unused = parts.pop()
      return parts       
   } 

   const notifications = 
      Rx.fromEvent(socket, "data")
      |> RxOp.mergeMap(parseMsgs)
      |> RxOp.map(JSON.parse)
      |> RxOp.share()
   
   const pushNotifications =
      notifications
      |> RxOp.filter(has("method"))
      |> RxOp.share()
   
   const pullNotifications =
      notifications
      |> RxOp.filter(notHave("method"))

   // Don't process the block with ClearJob = false
   const byClearJobs = (a, b) => last(b) == false

   const blocks =
      pushNotifications
      |> RxOp.filter(propEq("method", "mining.notify"))
      |> RxOp.distinctUntilKeyChanged("params", byClearJobs)
      |> RxOp.pluck("params")

   const target =
      pushNotifications
      |> RxOp.filter(propEq("method", "mining.set_difficulty"))
      |> RxOp.mergeMap(prop("params"))
      |> RxOp.map(diffToTarget)

   const send = (data) =>
      JSON.stringify(data)
      |> concat(?, "\n")
      |> socket.write

   const hook = (method, params, cb) => {
      const data = { id, method, params }
      send(data)
      const onNext = ({error, result}) =>
         error
            ? cb(error, null)
            : cb(null, result)
      const resp = pullNotifications |> RxOp.take(1)  
      resp.subscribe(onNext, cb(?, null))
   }

   // callback-ish versions
   // _connect :: port -> host -> cb -> socket
   const _connect   = socket.connect(?, ?, ?)
   const _subscribe = hook("mining.subscribe", [], ?)
   const _authorize = hook("mining.authorize", ?, ?)
   const _submit    = hook("mining.submit", ?, ?)
   const _close     = socket.destroy(?)

   const connect   = bindCallback(_connect)
   const subscribe = bindNodeCallback(_subscribe)
   const authorize = bindNodeCallback(_authorize)
   // don't want to fail on error, hence bindCallback
   const submit    = bindCallback(_submit)

   const parseExtraNonce = (resp) =>
      resp
      |> nth(1)
      |> pickIdxs([1, 2])

   const setupConnection =
      Rx.concat(
         connect(port, host),
         subscribe(),
         authorize([user, pass])
      )
      |> RxOp.toArray() // waiting for all to finish

   const extraNonce =
      setupConnection
      |> RxOp.map(parseExtraNonce)

   const blockInfo =
      Rx.combineLatest([extraNonce, blocks, target])
      |> repeatOn(socketError)
      |> RxOp.map(unnest) // [1, 2, [[3]]] -> [1, 2, [3]]

   return {
      blocks,
      target,
      extraNonce,
      socketError,
      blockInfo,
      connect,
      subscribe,
      authorize,
      submit,
      close : _close
   }
}

module.exports = Stratum