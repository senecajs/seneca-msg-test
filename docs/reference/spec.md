# Test specification

The object accepted by `SenecaMsgTest(seneca, spec)`: its properties,
the properties of each call, how a call becomes a message, how replies
and errors are matched, and how the specification is validated.

## Spec properties

| Property | Type | Default | Effect |
| -------- | ---- | ------- | ------ |
| `init` | `(seneca) => seneca` | none | Called with the instance when `SenecaMsgTest` is called, before the test function runs. Its return value replaces the instance, so it must return it. Lets a spec file load the plugin under test, for example `init: (seneca) => seneca.use('./p0.js')`. |
| `test` | boolean | `true` | At the start of a run, put the instance into Seneca test mode with `seneca.test()`: the readable test logger at level `warn`, callpoints in log entries and errors. `false` leaves the instance's logging as configured. |
| `log` | boolean | `false` | With `test: true`, log every message: `seneca.test(null, 'print')`. |
| `print` | boolean | none | Print the message, error and reply of every call, as `print: true` on each call. |
| `data` | object | `{}` | Entities to load into the in-memory store before the first call, as `{ base: { name: { id: entity } } }` (the layout of `role:mem-store,cmd:export`). Sent as `role:mem-store,cmd:import` with `merge: true`, `json` (the data as JSON) and `default$: {}`, so without the entity plugin the import is a no-op. |
| `context` | object | `{}` | The initial reference context. Call records are added to this object under the call `name`; its entries can be referenced from `params` and `out`; it is passed to `params`, `delegate` and `verify` functions. |
| `pattern` | string | `''` | Jsonic pattern merged into every call message (see Message assembly), and the scope of the missing messages check (`seneca.list(pattern)`). |
| `fix` | string | `''` | Deprecated name for `pattern`; used only when `pattern` is empty. |
| `delegates` | object | `{}` | Named delegates. Each value is the argument array of `seneca.delegate(fixedargs, fixedmeta)`; items are objects or `null`. The delegates are created once the instance is ready, before the first call, and selected per call with `delegate: name`. |
| `allow.missing` | boolean | `false` | `true` skips the missing messages check: patterns of the instance under `pattern` that no call resolves to no longer fail the run. |
| `calls` | array, or `(LN) => array` | none | The calls to run, in order. A function is called at the start of each run with `LN` (see [API](api.md#other-exports)) and must return the array; its result is not validated. Required: a run without `calls` throws. |

Unknown top level properties are allowed.

## Call properties

| Property | Type | Default | Effect |
| -------- | ---- | ------- | ------ |
| `name` | string, at least one character | none | Stores the call record under this name in the reference context (see [The call record](references.md#the-call-record)), so that later calls, and `out` of this call, can reference it. Also shown in failure messages. |
| `pattern` | string, at least three characters | none | Jsonic pattern of the message, merged over `spec.pattern` and `params`. Every call needs one. |
| `params` | object, or `(call, context, spec, seneca) => object` | `{}` | The message properties. In the object form, references are resolved. The function form is called just before the message is built and its result is used as is. |
| `out` | object, array, `null`, or absent | absent | Expected reply. Absent: the reply is not checked. `null`: the reply must be `null` or `undefined`. Object or array: matched against the reply (see Matching) after references are resolved; values may be Joi schemas. |
| `err` | object, or absent | absent | Expected error. Absent: an error reply fails the call. Present: an error reply is required and matched against the error view (see Matching); values may be Joi schemas. References are not resolved. |
| `delegate` | string, array, or `(call, context, spec) => instance` | none | Which instance sends the message. A string names an entry of `spec.delegates`. An array creates `instance.delegate(...array)` for this call. A function is called with `this` bound to the instance and returns the instance to use. |
| `verify` | `(call, context, spec, instance) => result` | none | Called after the `err` and `out` checks with `call.result = { msg, err, out, meta }` set. `undefined` or `true` passes; any other value fails the call with `result.message` or the value itself. |
| `run` | boolean | none | `false` skips the call. |
| `print` | boolean | `false` | Print this call's message, error and reply. |
| `print_context` | boolean | `false` | Print the reference context (`console.dir`, depth 3) before this call. |
| `line` | string | none | Location shown in failure messages, as `file~line` (the file name up to its first dot, and the line). Set by `LN`. |

The harness sets `call.msgstr` (the message as a Jsonic string) and,
when `verify` is present, `call.result`.

## Message assembly

The message of a call is

```js
Object.assign({}, params, Jsonic(spec.pattern), Jsonic(call.pattern))
```

so a property given in both wins in the order call pattern, spec
pattern, params. The patterns are Jsonic strings: `'role:shop,cmd:get'`
is `{ role: 'shop', cmd: 'get' }`. In failure messages the message is
shown as `Jsonic.stringify(msg)`, for example `{id:i0,role:shop,cmd:get}`.

The message is sent with `instance.act(msg, callback)`, where
`instance` is the delegate selected by `delegate`, or the spec's
instance.

## Matching

`out` and `err` are matched with [Optioner](https://github.com/rjrodger/optioner)
in literal mode (`must_match_literals`), which turns the expected value
into a Joi schema:

* A literal value becomes `Joi.any().required().valid(value)`: the
  reply's value must be present and equal, type included. `price: '0.5'`
  does not match `0.5`.
* A Joi schema is used as it is. Use `SenecaMsgTest.Joi` to build it.
* Properties of the reply that are not listed are ignored (unknown keys
  are allowed at every level).
* Nested objects are matched recursively.
* An expected array is matched element by element, by index. Extra
  elements in the reply are ignored; a missing element fails
  (`"1.id" is required`). `out: []` only checks that there is a reply.
* An expected object against an array reply fails with
  `"value" must be of type object`.

`out` is matched against the reply itself. `err` is matched against a
plain object view of the error: all enumerable properties (for example
`code` and `details`), plus `message` and `name`, and, when `err.orig`
is an `Error` (Seneca 3), `orig` in the same form. See
[Assert on errors on Seneca 3 and 4](../how-to/assert-on-errors.md).

## Validation

`SenecaMsgTest` validates the spec with Optioner and throws the Joi
error when it does not match, for example:

| Spec | Error |
| ---- | ----- |
| `{ pattern: 5, calls: [] }` | `"pattern" must be a string` |
| `{ calls: [{ pattern: 'a' }] }` | `"calls[0].pattern" length must be at least 3 characters long` |
| `{ calls: [{ pattern: 'a:1', out: 'x' }] }` | `"calls[0].out" must be one of [object, array]` |
| `{ calls: [{ pattern: 'a:1', delegate: 7 }] }` | `"calls[0].delegate" must be one of [string, array, object]` |
| `{ calls: [{ pattern: 'a:1', other: 1 }] }` | `"calls[0].other" is not allowed` |

Calls in a `calls` array accept only the properties listed above. Calls
returned by a `calls` function are not validated, so they may carry
extra properties.
