/* The README example. Run with: node --test docs/examples/quick-example.test.js */
'use strict'

const { test, after } = require('node:test')

const Seneca = require('seneca')
const SenecaMsgTest = require('../..') // in your project: require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' })
  .use('entity')
  .use(function color() {
    this.add('role:color,cmd:add', function (msg, reply) {
      this.make$('color/item')
        .data$({ name: msg.name, hex: msg.hex })
        .save$(reply)
    })
    this.add('role:color,cmd:get', function (msg, reply) {
      this.make$('color/item').load$(msg.id, reply)
    })
  })

const spec = {
  pattern: 'role:color',
  calls: [
    {
      name: 'red',
      pattern: 'cmd:add',
      params: { name: 'red', hex: '#f00' },
      out: { name: 'red', hex: '#f00' },
    },
    {
      pattern: 'cmd:get',
      params: { id: '`red:out.id`' }, // the id replied by the call named red
      out: { name: 'red' },
    },
  ],
}

test('color messages', SenecaMsgTest(seneca, spec))

after(() => seneca.close())
