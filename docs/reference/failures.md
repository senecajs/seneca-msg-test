# Failure messages

A run rejects with one `Error` for the first failure. Where a message
contains `<call>`, it is the call's `name` followed by `~` (when the
call has a name), the message as sent as a Jsonic string, and
` (file~line)` when the call was wrapped with `LN` (the file name up to
its first dot, and the line), for example
`pear~{name:pear,price:0.75,role:shop,cmd:add} (shop~6)`.

| Message | Raised when |
| ------- | ----------- |
| `Test calls not defined for: <pattern>; <pattern>` | The missing messages check found patterns of the instance under the spec's `pattern` that no call resolves to, and `allow.missing` is not set. Raised before any call runs. |
| `Delegate not defined: <name>. Message was: <msg>` | A call's `delegate` names an entry that is not in `spec.delegates` when the call runs. |
| `Unknown delegate reference: <value>. Message was: <msg>` | A call's `delegate` is neither a string, an array nor a function. Only reachable with a `calls` function, since the schema rejects other types. |
| `Error not expected for: <call>, err: <error>` | The action replied with an error and the call has no `err`. |
| `Error expected for: <call>, was null` | The call has `err` and the action replied without an error. |
| `Error for: <call> was invalid: <reason>` | The error does not match `err`; `<reason>` is the Joi report, for example `"message" must be [not-foo]`. |
| `Output not expected for: <call>, out: <reply>` | The call has `out: null` and the action replied with a value. |
| `Output expected for: <call>, was null` | The call has an `out` object or array and the reply is `null` or `undefined`. |
| `Output for: <call> was invalid: <reason>` | The reply does not match `out`; `<reason>` is the Joi report, for example `"price" must be [0.5]`, `"1.id" is required` or `"value" must be of type object`. |
| `Verify of: <call> failed: <message>` | `verify` returned a value other than `undefined` or `true`; `<message>` is its `message` property or the value itself. |
| A Joi message such as `"calls[0].pattern" length must be at least 3 characters long` | The spec is invalid. Thrown by `SenecaMsgTest(seneca, spec)` itself, not by the run. See [Validation](spec.md#validation). |

Errors thrown inside `params`, `delegate` or `verify` functions, and
errors thrown by `act` itself, reject the run as they are.
