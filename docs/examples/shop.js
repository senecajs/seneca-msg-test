/* A small plugin whose messages are tested in shop.test.js. */
'use strict'

module.exports = function shop(options) {
  const seneca = this

  seneca
    .add('role:shop,cmd:add', function (msg, reply) {
      this.make$('shop/item')
        .data$({ name: msg.name, price: msg.price })
        .save$(reply)
    })

    .add('role:shop,cmd:get', function (msg, reply) {
      this.make$('shop/item').load$(msg.id, function (err, item) {
        if (err) return reply(err)
        if (null == item) return reply(new Error('item not found: ' + msg.id))
        reply(item)
      })
    })

    .add('role:shop,cmd:list', function (msg, reply) {
      this.make$('shop/item').list$(msg.q || {}, reply)
    })

    .add('role:shop,cmd:price', function (msg, reply) {
      this.make$('shop/item').load$(msg.id, function (err, item) {
        if (err) return reply(err)
        if (null == item) return reply(new Error('item not found: ' + msg.id))
        reply({
          id: item.id,
          name: item.name,
          quantity: msg.quantity,
          total: item.price * msg.quantity,
        })
      })
    })
}
