'use strict'

const defaultOrderBook = {
  bids: {},
  asks: {},
  orderIdMap: {},
}


function getOrder(orderId, instrument, price, qty, side) {
  return {
    orderId: orderId,
    instrument: instrument,
    price: price,
    qty: qty,
    side: side,
    leavesQty: qty
  }
}

function getTrade(orderId, instrument, bestPrice, matchQty, tradeSide, currTradeId) {
  return {
    orderId: orderId,
    instrument: instrument,
    tradePrice: bestPrice,
    tradeQty: matchQty,
    tradeSide: tradeSide,
    tradeId: currTradeId
  }
}

function getObjMin (object) {
  const arr = Object.keys(object)
  return arr.length ? Math.min.apply(null, arr) : null
}

function getObjMax (object) {
  const arr = Object.keys(object)
  return arr.length ? Math.max.apply(null, arr) : null
}

function sumOfProperty (arr, property) {
  let sum = 0
  arr.forEach(ele => { sum += ele[property] })
  return sum
}

module.exports = {
  defaultOrderBook,
  getOrder,
  getTrade,
  getObjMin,
  getObjMax,
  sumOfProperty
}
