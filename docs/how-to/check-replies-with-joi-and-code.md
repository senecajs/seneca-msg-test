# Check replies with Joi rules and code

How to express expectations that a literal value cannot: generated ids,
ranges, lists, and checks that need code.

## 1. Know the literal matching rules

An `out` object is a partial description of the reply:

* Every listed value must be equal to the reply's value, including its
  type: `price: '0.5'` does not match the number `0.5`
  (`"price" must be [0.5]`).
* Properties of the reply that are not listed are ignored.
* Nested objects are matched the same way, recursively.
* An `out` object against an array reply fails with
  `"value" must be of type object`.

## 2. Use Joi rules for values you cannot predict

Any value inside `out` can be a Joi schema. Use the `Joi` exported by
the harness, so that the schema comes from the same Joi copy that does
the matching:

```js
const Joi = require('seneca-msg-test').Joi

{
  pattern: 'cmd:add',
  params: { name: 'pear', price: 0.75 },
  out: {
    id: Joi.string().required(),
    price: Joi.number().min(0),
    deleted: Joi.any().forbidden(),
    name: 'pear',
  },
},
```

A failing rule reports Joi's message, for example
`Output for: {id:i0,role:shop,cmd:get} was invalid: "price" must be larger than or equal to 10`.
References are not resolved inside Joi schemas.

## 3. Check array replies

An expected array is matched element by element, by index:

```js
{ pattern: 'cmd:list', params: {}, out: [{ id: 'i0' }, { id: '`pear:out.id`' }] },
```

* Each listed element is matched as an object, as above.
* Extra elements in the reply are ignored: `out: [{ id: 'i0' }]` passes
  against a reply with two items.
* A missing element fails: `"1.id" is required`.
* `out: []` only checks that there is a reply.

To assert the length, use a `verify` function (below).

## 4. Assert that there is no reply

`out: null` fails when the action replied with anything other than
`null` or `undefined` (`Output not expected for: ...`). Leaving `out`
out means that the reply is not checked at all.

## 5. Compute parameters with a function

`params` can be a function `(call, context, spec, seneca)` that returns
the message properties. It is useful when a value needs a calculation,
or when you prefer code to backtick references:

```js
{
  pattern: 'cmd:price',
  params: (call, context) => ({ id: context.pear.out.id, quantity: 3 }),
  out: { total: 2.25 },
},
```

## 6. Check with code in `verify`

`verify` runs after the `err` and `out` checks. It receives
`(call, context, spec, instance)`; `call.result` holds `msg`, `err`,
`out` and `meta`. Return `undefined` or `true` to pass. Anything else
fails the call: an `Error` or an object with a `message`, or a string,
reported as `Verify of: <call> failed: <message>`.

```js
{
  pattern: 'cmd:list',
  params: {},
  verify: (call) => {
    if (2 !== call.result.out.length) return 'expected two items'
    if (call.result.out[0].price > call.result.out[1].price) return new Error('not sorted by price')
    return true
  },
},
```

`verify` may also change the spec for later calls, for example add a
delegate (see [Use delegates](use-delegates.md)).
