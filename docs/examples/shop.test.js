/* Run with: node --test docs/examples/shop.test.js */
'use strict'

const { test, after } = require('node:test')

const Seneca = require('seneca')
const SenecaMsgTest = require('../..') // in your project: require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' }).use('entity').use(require('./shop.js'))

test('shop messages', SenecaMsgTest(seneca, require('./shop.spec.js')))

after(() => seneca.close())
