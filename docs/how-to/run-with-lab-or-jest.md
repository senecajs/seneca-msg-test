# Run with lab, jest or mocha

How to use the harness with a test runner other than `node:test`. The
function returned by `SenecaMsgTest(seneca, spec)` takes no arguments
and returns a promise, which every common runner accepts as a test body.
The versions below were run with the examples from this repository on
the Seneca 4 prerelease.

The shared pieces: a plugin, and a spec file with `test: false` so that
the silent instance stays silent.

```js
// shop.spec.js
module.exports = {
  test: false,
  pattern: 'role:shop',
  calls: [
    { name: 'apple', pattern: 'cmd:price', params: { item: 'apple', quantity: 2 }, out: { item: 'apple', total: 1 } },
    { pattern: 'cmd:price', params: { item: 'pear', quantity: '`apple:out.quantity`' }, out: { total: 1.5 } },
    { pattern: 'cmd:price', params: { item: 'kiwi' }, err: { message: 'unknown item: kiwi' } },
  ],
}
```

## lab (@hapi/lab 26)

```js
const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())
const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' }).use('entity').use('./shop.js')

lab.test('shop messages', SenecaMsgTest(seneca, require('./shop.spec.js')))

lab.after(() => new Promise((resolve) => seneca.close(resolve)))
```

```sh
npx lab -v shop.lab.js
```

Lab calls the test function with a `flags` argument, which the harness
ignores.

## jest (29)

```js
const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' }).use('entity').use('./shop.js')

test('shop messages', SenecaMsgTest(seneca, require('./shop.spec.js')))

afterAll(() => new Promise((resolve) => seneca.close(resolve)))
```

```sh
npx jest shop.test.js
```

Jest treats a test function with no parameters as promise based, which
is what the harness returns. Jest's default timeout is five seconds per
test; a long spec may need `jest.setTimeout` or the `timeout` argument.

## mocha (11)

```js
const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' }).use('entity').use('./shop.js')

it('shop messages', SenecaMsgTest(seneca, require('./shop.spec.js')))

after(() => new Promise((resolve) => seneca.close(resolve)))
```

```sh
npx mocha shop.mocha.js
```

## Close the instance

The harness does not close the instance, so that several specs can run
against it. Close it in the runner's teardown hook, as above, so that
the test process exits. The callback form of `close` works on Seneca 3
and 4; on Seneca 4 `await seneca.close()` works too.

## Several specs on one instance

A spec can be run more than once, and several specs can share an
instance. Seeded `data` accumulates in the store across runs (see
[Seed entity data](seed-entity-data.md)), and the reference context is
per spec object: the `context` property of the spec receives the call
records, so reuse of a spec object keeps the records of the previous
run.
