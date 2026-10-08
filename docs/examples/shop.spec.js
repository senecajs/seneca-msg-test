/* The message test specification for the shop plugin. */
'use strict'

const Joi = require('../..').Joi // in your project: require('seneca-msg-test').Joi

module.exports = {
  // Prefix for every call pattern: cmd:get becomes role:shop,cmd:get.
  pattern: 'role:shop',

  // The instance is created with log:'silent' in shop.test.js. Test
  // mode (test:true, the default) would print the expected error of the
  // last call at level error, so it is turned off here.
  test: false,

  // Entities loaded into the in-memory store before the calls run,
  // keyed by base, name and id.
  data: {
    shop: {
      item: {
        i0: { entity$: '-/shop/item', id: 'i0', name: 'apple', price: 0.5 },
      },
    },
  },

  // Run in order. Each call is a message and the expected reply.
  calls: [
    {
      pattern: 'cmd:get',
      params: { id: 'i0' },
      out: { name: 'apple', price: 0.5 },
    },
    {
      // Named calls can be referenced by later calls.
      name: 'pear',
      pattern: 'cmd:add',
      params: { name: 'pear', price: 0.75 },
      out: { id: Joi.string().required(), name: 'pear', price: 0.75 },
    },
    {
      pattern: 'cmd:get',
      params: { id: '`pear:out.id`' },
      out: { name: 'pear', price: 0.75 },
    },
    {
      pattern: 'cmd:list',
      params: {},
      out: [{ id: 'i0' }, { id: '`pear:out.id`' }],
    },
    {
      pattern: 'cmd:price',
      params: { id: '`pear:out.id`', quantity: 4 },
      out: { name: 'pear', quantity: 4, total: 3 },
    },
    {
      pattern: 'cmd:get',
      params: { id: 'nope' },
      err: { message: 'item not found: nope' },
    },
  ],
}
