'use strict'
const { orderSide } = require('./utils/orderSide')
const utils = require('./utils/utils')

let orderBooks = {};
let currOrderId = 0;
let currTradeId = 0;

const exchange = async (instrument, price, quantity, side) => {
  if (side === orderSide.BUY || side === orderSide.SELL) {
    
    const trades = [];
    currOrderId += 1;
    const orderId = currOrderId;
    const order = utils.getOrder(orderId, instrument, price, quantity, side
    );

    let orderBook = orderBooks[instrument];
    if (!orderBook) {
      orderBook = utils.defaultOrderBook;
    }

    orderBooks[instrument] = orderBook;
    if (side === orderSide.BUY) {
      let bestPrice = utils.getObjMin(orderBook.asks);
      while (bestPrice !== null && (bestPrice === 0 || price >= bestPrice) && order.leavesQty > 0) {
        const qtyAtBestPrice = utils.sumOfProperty(orderBook.asks[bestPrice], 'leavesQty');
        let matchQty = Math.min(qtyAtBestPrice, order.leavesQty);
        if (matchQty > 0) {
          currTradeId += 1;
          order.cumQty += matchQty;
          order.leavesQty -= matchQty;

          trades.push(utils.getTrade(orderId, instrument, bestPrice, matchQty, orderSide.BUY, currTradeId))

          while (matchQty > 0) {
            const orderHit = orderBook.asks[bestPrice][0];
            const orderMatchQuantity = Math.min(matchQty, orderHit.leavesQty);
            currTradeId += 1;

            trades.push(utils.getTrade(orderHit.orderId, orderHit.instrument, bestPrice, orderMatchQuantity, orderSide.SELL, currTradeId ))

            orderHit.cumQty += orderMatchQuantity;
            orderHit.leavesQty -= orderMatchQuantity;
            matchQty -= orderMatchQuantity;
            if (orderHit.leavesQty === 0) {
              orderBook.asks[bestPrice].splice(0, 1);
            }

            if (orderBook.asks[bestPrice].length === 0) {
              delete orderBook.asks[bestPrice];
            }

            bestPrice = utils.getObjMin(orderBook.asks);
          }

        } else {
          return {
            status: false,
            statusCode: 'INVALID_QUANTITY',
            message: `Invalid Order Quantity`
          };
        }
      }
      if (order.leavesQty > 0) {
        if (!orderBook.bids[price]) {
          orderBook.bids[price] = [];
        }
        orderBook.bids[price].push(order);

        orderBook.orderIdMap[orderId] = order;
      }
    } else {
      let bestPrice = utils.getObjMax(orderBook.bids);
      while (bestPrice !== null && (bestPrice === 0 || price <= bestPrice) && order.leavesQty > 0) {
        const qtyAtBestPrice = utils.sumOfProperty(orderBook.bids[bestPrice], 'leavesQty');

        let matchQty = Math.min(qtyAtBestPrice, order.leavesQty);
        if (matchQty > 0) {
          currTradeId += 1;
          order.cumQty += matchQty;
          order.leavesQty -= matchQty;

          trades.push(utils.getTrade(orderId, instrument, bestPrice, matchQty, orderSide.SELL, currTradeId))

          while (matchQty > 0) {
            const orderHit = orderBook.bids[bestPrice][0];
            const orderMatchQuantity = Math.min(matchQty, orderHit.leavesQty);
            currTradeId += 1;

            trades.push(utils.getTrade(orderHit.orderId, orderHit.instrument, bestPrice, orderMatchQuantity, orderSide.BUY, currTradeId ))

            orderHit.cumQty += orderMatchQuantity;
            orderHit.leavesQty -= orderMatchQuantity;
            matchQty -= orderMatchQuantity;
            if (orderHit.leavesQty === 0) {
              orderBook.bids[bestPrice].splice(0, 1);
            }

            if (orderBook.bids[bestPrice].length === 0) {
              delete orderBook.bids[bestPrice];
            }

            bestPrice = utils.getObjMin(orderBook.bids);
          }

        } else {
          return {
            status: false,
            statusCode: 'INVALID_QUANTITY',
            message: `Invalid Order Quantity`
          };
        }
      }
      if (order.leavesQty > 0) {
        if (!orderBook.asks[price]) {
          orderBook.asks[price] = [];
        }
        orderBook.asks[price].push(order);
        orderBook.orderIdMap[orderId] = order;
      }
    }

    return {
      status: true,
      statusCode: 'ORDER_PLACED',
      message: `Order Placed`,
      data: {
        order: order,
        trades: trades
      }
    };
  } else {
    return {
      status: false,
      statusCode: 'INVALID_SIDE',
      message: `Invalid Order Side`
    };
  }
}

const cancelOrder = async (orderId, instrument) => {
  if (Object.keys(orderBooks).indexOf(instrument) >= 0) {
    const orderBook = orderBooks[instrument];

    if (Object.keys(orderBook.orderIdMap).indexOf(`${orderId}`) === -1) {
      return {
        status: false,
        statusCode: 'INVALID_ORDER_ID',
        message: `Order Id Doesn't Exist`
      };
    }

    const order = orderBook.orderIdMap[orderId];

    let priceLevel = [];
    if (order.side === orderSide.BUY) {
      if (Object.keys(orderBook.bids).indexOf(`${order.price}`) === -1) {
        return {
          status: false,
          statusCode: 'INVALID_ORDER',
          message: `Order Doesn't Exist`
        };
      }
      priceLevel = orderBook.bids[order.price];
    } else {
      if (Object.keys(orderBook.asks).indexOf(`${order.price}`) === -1) {
        return {
          status: false,
          statusCode: 'INVALID_ORDER',
          message: `Order Doesn't Exist`
        };
      }
      priceLevel = orderBook.asks[order.price];
    }

    for (let i = 0; i < priceLevel.length; i++) {
      const iOrder = priceLevel[i];
      if (iOrder.orderId === orderId) {
        iOrder.leavesQty = 0;
        delete orderBook.orderIdMap[orderId];
        priceLevel.splice(i, 1);

        if (priceLevel.length === 0) {
          if (order.side === orderSide.BUY) {
            delete orderBook.bids[order.price];
          } else {
            delete orderBook.asks[order.price];
          }
        }

        return {
          status: true,
          statusCode: 'ORDER_CANCELED',
          message: `Order Cancelled`
        };
      }
    }
  } else {
    return {
      status: false,
      statusCode: 'INVALID_SYMBOL',
      message: `Invalid Symbol`
    };
  }
}

module.exports = {
  newOrder,
  cancelOrder
}
