# Getting started: test a plugin's messages declaratively

In this tutorial you write a small Seneca plugin and a declarative test
for its messages: a list of messages to send and the replies to expect.
The harness sends them in order, checks each reply, and tells you which
message failed and why. It takes about fifteen minutes. The finished
files are in [docs/examples](../examples/).

## 1. Install

You need Node.js 18 or later (24 and 22 are tested) and a project that
uses Seneca. This tutorial uses the Seneca 4 prerelease and the entity
plugin, which provides the in-memory store that the harness seeds with
test data:

```sh
npm install seneca@^4.0.0-rc5 seneca-entity
npm install --save-dev seneca-msg-test
```

On Seneca 3, also install `seneca-promisify`. The harness loads it when
the instance has no `post` method.

## 2. The plugin under test

Create `shop.js`. It keeps items in `shop/item` entities and has four
messages:

```js
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
```

`cmd:get` and `cmd:price` reply with an error when the item does not
exist. That is a behaviour worth testing too.

## 3. The test specification

Create `shop.spec.js`. It is plain data: a few settings and the list of
calls to make.

```js
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
```

Reading it from the top:

* `pattern: 'role:shop'` is merged into every message, so each call only
  names the part that differs: `cmd:get`, `cmd:add` and so on.
* `data` seeds the store. The layout is base (`shop`), then name
  (`item`), then id. The apple exists before the first call runs.
* The first call sends `{ role: 'shop', cmd: 'get', id: 'i0' }` and
  expects a reply whose `name` is `'apple'` and whose `price` is `0.5`.
  Properties that are not listed (here `id` and `entity$`) are ignored,
  so you describe what matters.
* The second call is named `pear`. The store generates the id, so the
  expected `id` is a Joi rule, `Joi.string().required()`, instead of a
  literal. Use the `Joi` exported by the harness so that the versions
  match.
* The third call uses that generated id: `` `pear:out.id` `` is replaced
  by `out.id` of the call named `pear` before the message is sent. The
  same reference inside `out` of the `cmd:list` call checks that the
  list contains the apple and the pear, in that order.
* The last call expects an error. `err` is matched against the error the
  way `out` is matched against the reply: here the `message` must be
  exactly `'item not found: nope'`.

## 4. The test file

Create `shop.test.js`:

```js
/* Run with: node --test docs/examples/shop.test.js */
'use strict'

const { test, after } = require('node:test')

const Seneca = require('seneca')
const SenecaMsgTest = require('../..') // in your project: require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' }).use('entity').use(require('./shop.js'))

test('shop messages', SenecaMsgTest(seneca, require('./shop.spec.js')))

after(() => seneca.close())
```

`SenecaMsgTest(seneca, spec)` validates the spec and returns an async
function. Calling that function runs the calls; it resolves when all of
them passed and rejects with an `Error` describing the first failure.
Passing it straight to `test` is all a test needs. The `after` hook
closes the instance so that the process exits when the tests are done;
hooks run whether the test passed or failed.

## 5. Run it

```sh
node --test shop.test.js
```

```
✔ shop messages (130.290132ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 506.852173
```

## 6. What happened

When the test function ran, the harness:

1. Waited for the instance to be ready (the plugin had loaded).
2. Left the instance's logging as it was, because `test` is `false`.
3. Loaded `data` into the in-memory store with the message
   `role:mem-store,cmd:import`.
4. Listed the patterns of the instance under `role:shop` and checked
   that every one of them appears in `calls`. All four do; a plugin
   message without a call would have failed the test before any message
   was sent.
5. Sent the six messages one after another with `seneca.act`. For each
   reply it checked `err` and `out`, then stored the result of the named
   call `pear` in the reference context for the calls that followed.

## 7. Make it fail

In the first call, change `name: 'apple'` to `name: 'pear'` and run the
test again. It fails and names the call, as the message that was sent,
and the first property that did not match:

```
✖ shop messages (122.343315ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
...
✖ failing tests:

test at shop.test.js:13:1
✖ shop messages (122.343315ms)
  Error: Output for: {id:i0,role:shop,cmd:get} was invalid: "name" must be [pear]
```

(The stack trace that follows is omitted here.) Change the name back
before you continue.

## Next steps

* Give calls names and reuse their replies:
  [Reference earlier replies](../how-to/reference-earlier-replies.md).
* Seed more data and understand the layout:
  [Seed entity data for message tests](../how-to/seed-entity-data.md).
* Assert on errors in a way that works on Seneca 3 and 4:
  [Assert on errors on Seneca 3 and 4](../how-to/assert-on-errors.md).
* Use another test runner:
  [Run with lab, jest or mocha](../how-to/run-with-lab-or-jest.md).
* Look up every property: [Test specification](../reference/spec.md).
