# Assert on errors

How to describe the error a message is expected to produce.

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
`details`. Seneca 4 passes the error to the test as the action replied
it:

```js
// the action: reply(err) where err.message === 'bar', err.code === 'foo_failed'
err: { message: 'bar', code: 'foo_failed', details: { text: 'bar' } },
```

When the error carries the error it was built from in `orig`, the view
presents `orig` in the same form, so `orig.message` can be matched.

Values that you cannot predict exactly can be Joi rules:

```js
const Joi = require('seneca-msg-test').Joi

err: { message: Joi.string().pattern(/foo/) },
```

## 3. Convert an expectation written for Seneca 3

Seneca 3 wrapped every action error: `message` and `msg` were
`seneca: Action <pattern> failed: <original message>.`, `code` was
`act_execute` and the original error was `orig`. On Seneca 4 such an
expectation fails, because the error is the action's own. Match the
action's error directly:

```js
// Seneca 3, seneca-msg-test 4
err: { code: 'act_execute', orig: { message: 'foo', code: 'foo_failed' } },

// Seneca 4, seneca-msg-test 5
err: { message: 'foo', code: 'foo_failed' },
```

A Joi rule on `message` that both message forms satisfy, as above,
needs no change.

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
const seneca = Seneca({ log: 'silent' }).use('@seneca/entity').use(plugin)

module.exports = { pattern: 'role:shop', test: false, calls: [ ... ] }
```
