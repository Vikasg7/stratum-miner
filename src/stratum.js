const net = require("net")
const { has, prop, concat, propEq,
        nth, last, unnest } = require("ramda")
const Rx = require("rxjs")
const RxOp = require("rxjs/operators")
const { diffToTarget, notHave, repeatOn, msgParser,
        pickIdxs, bindCb, bindNodeCb } = require("./utils")

const Stratum = (config) => {
   const { id, user, pass, host, port } = config

   const socket = new net.Socket()
   socket.setEncoding("utf-8")

   // Need an error listener So that the process don't blow up.
   // Also to remove any un-called connect listeners to prevent
   // max-listener error if target server don't exist
   socket.on("error", socket.removeAllListeners("connect", ?))

   const socketClose =
      Rx.fromEvent(socket, "close")
      |> RxOp.take(1)

   const parseMsgs = msgParser()

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
   const byClearJobs = (a, b) => 
      last(b) == false

   const blocks =
      pushNotifications
      |> RxOp.filter(propEq("method", "mining.notify"))
      |> RxOp.pluck("params")
      |> RxOp.distinctUntilChanged(byClearJobs)

   const target =
      pushNotifications
      |> RxOp.filter(propEq("method", "mining.set_difficulty"))
      |> RxOp.mergeMap(prop("params"))
      |> RxOp.map(diffToTarget)

   const send = (data) =>
      JSON.stringify(data)
      |> concat(?, "\n")
      |> socket.write(?)

   const hookNodeCb = (method, params, cb) => {
      const data = { id, method, params }
      send(data)
      const onNext = ({error, result}) =>
         error
            ? cb(error, null)
            : cb(null, result)
      const resp = pullNotifications |> RxOp.take(1)  
      resp.subscribe(onNext, cb(?, null))
   }

   const hookCb = (method, params, cb) => {
      const data = { id, method, params }
      send(data)
      const resp = pullNotifications |> RxOp.take(1)
      resp.subscribe(cb)
   }

   const connect = 
      socket.connect(?, ?, ?)
      |> bindCb

   const subscribe = 
      hookNodeCb("mining.subscribe", [], ?)
      |> bindNodeCb

   const authorize = 
      hookNodeCb("mining.authorize", ?, ?)
      |> bindNodeCb

   const submit = 
      hookCb("mining.submit", ?, ?)
      |> bindCb

   const close = socket.destroy(?)

   const parseExtraNonce = (resp) =>
      resp
      |> nth(1)
      |> pickIdxs([1, 2])

   const steps = 
      [ connect(port, host)
      , subscribe()
      , authorize([user, pass])
      ]

   const setupConnection =
      Rx.concat(...steps)
      |> RxOp.toArray() // waiting for all to finish

   const extraNonce =
      setupConnection
      |> RxOp.map(parseExtraNonce)

   const blockInfo =
      Rx.combineLatest([extraNonce, blocks, target])
      |> repeatOn(socketClose)
      |> RxOp.map(unnest) // [1, 2, [[3]]] -> [1, 2, [3]]

   return {
      blocks,
      target,
      extraNonce,
      socketClose,
      blockInfo,
      setupConnection,
      connect,
      subscribe,
      authorize,
      submit,
      close
   }
}

module.exports = Stratum