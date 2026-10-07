# Assert on errors on Seneca 3 and 4

How to describe the error a message is expected to produce, on either
Seneca version.

## 1. Expect an error with `err`

When a call has an `err` property, the action must reply with an error,
and the error must match `err` the way a reply matches `out`: listed
literal values must be equal, other properties are ignored, and Joi
rules are applied. A call without `err` fails on any error
(`Error not expected for: ...`); a call with `err` fails when there is
none (`Error expected for: ..., was null`).

```js
{
  pattern: 'cmd:get',
  params: { id: 'nope' },
  err: { message: 'item not found: nope' },
},
```

## 2. Know what the error looks like

The harness matches `err` against a plain object view of the error: its
`message` and `name`, and all enumerable properties such as `code` and
`details`. What those hold depends on the Seneca version.

On Seneca 4 (4.0.0-rc5 and later) the error reaches the test as the
action replied it:

```js
// the action: reply(err) where err.message === 'bar', err.code === 'foo_failed'
err: { message: 'bar', code: 'foo_failed', details: { text: 'bar' } },
```

On Seneca 3 the error is wrapped. `message` and `msg` are
`seneca: Action <pattern> failed: <original message>.`, `code` is
`act_execute`, the original error is `orig` (also viewed as a plain
object, so its `message` can be matched) and `details.message` is the
original message:

```js
err: {
  message: 'seneca: Action cmd:err,role:foo failed: foo.',
  code: 'act_execute',
  orig: { message: 'foo', code: 'foo_failed' },
},
```

## 3. Write one expectation for both versions

Either check the version in the test file:

```js
const SENECA3 = require('seneca/package.json').version.startsWith('3.')

err: SENECA3
  ? { code: 'act_execute', orig: { message: 'foo' } }
  : { message: 'foo' },
```

or use a Joi rule that both message forms satisfy:

```js
const Joi = require('seneca-msg-test').Joi

err: { message: Joi.string().pattern(/foo/) },
```

## 4. Inspect Seneca's own description of the failure

On Seneca 4 the wrapped description is in the meta data of the reply,
not in the error: `meta.err.code` is `act_execute` and
`meta.err.message` is `seneca: Action cmd:err,role:x failed: boom.`.
It is available to a `verify` function as `call.result.meta.err`:

```js
{
  pattern: 'cmd:err',
  err: { message: 'boom' },
  verify: (call) => 'act_execute' === call.result.meta.err.code,
},
```

## 5. Silence the expected error

Test mode (`test: true`, the default) switches the instance to the test
logger at level `warn`, which prints every action error with its stack
trace, including the ones you expect. For specs that exercise error
paths, create the instance with `log: 'silent'` and set `test: false`
in the spec so that the harness leaves the logging alone:

```js
const seneca = Seneca({ log: 'silent' }).use('entity').use(plugin)

module.exports = { pattern: 'role:shop', test: false, calls: [ ... ] }
```
