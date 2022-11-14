'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const { newOrder, cancelOrder} = require('./exchange')


const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('rpc_test', service.port, {})
}, 1000)

service.on('request', async (rid, key, payload, handler) => {
  let response = ''
  if(payload.type === 'CANCEL'){
    const orderResponse = await newOrder(payload.instrument, payload.price, payload.quantity, payload.side);
    const order = orderResponse.data.order
    response = await cancelOrder(order.orderId, order.instrument)
  } else {
    response = await newOrder(payload.instrument, payload.price, payload.quantity, payload.side)
  }
  handler.reply(null, response)
})
