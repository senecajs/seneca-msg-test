# Reference syntax

Strings inside `params` (object form) and `out` can refer to the
reference context: the records of earlier named calls and the entries
of the spec's `context` property. The syntax is that of
[Inks](https://github.com/rjrodger/inks).

## Syntax

| Expression | Result |
| ---------- | ------ |
| `` `pear:out.id` `` | The value at path `out.id` of the context entry `pear`. |
| `` `pear:out.items[1].id` `` | Paths are JavaScript property paths, array indexes included. |
| `` `cfg:limit` `` | An entry provided with the spec's `context` property. |
| `` `$.pear.out.price * 2` `` | Without a colon, a JavaScript expression evaluated with `$` bound to the whole context. |
| `` 'item-`pear:out.id`' `` | Text around a reference, or several references, produce a string; object values are inserted as JSON. |
| `` \` `` | A literal backtick. |

Rules:

* The name is everything before the first colon and is looked up as a
  key of the context, so names such as `foo/a1` work. The path after
  the colon is evaluated as JavaScript against that entry.
* A reference that is the whole string keeps the type of the value:
  `` `pear:out.price` `` is the number `0.75`.
* An unknown name, or a path that reaches no value, resolves to `null`.
* Backtick expressions are evaluated with `eval`; the spec is code that
  runs in the test process, as the rest of the test is.

## Where references are resolved

| Place | When |
| ----- | ---- |
| `params` (object form) | Before the message is built. Nested objects and arrays are walked. |
| `out` | When the reply is checked. The record of the current call is stored before `out` is checked, so a call can reference its own reply. |
| `err` | Not resolved. |
| Joi schemas inside `out` | Not resolved; schemas are left as they are. |
| `params`, `delegate` and `verify` functions | Not applicable: they receive the context as an argument. |

## The call record

When the reply of a call with a `name` arrives, the harness stores this
object in the context under the name, before the checks, and stores it
again after `verify`:

| Field | Value |
| ----- | ----- |
| `top_pattern` | The spec's `pattern`. |
| `pattern` | The call's `pattern`. |
| `params` | The parameters after references were resolved, or the result of the `params` function. |
| `msg` | The message as sent (see [Message assembly](spec.md#message-assembly)). |
| `err` | The error of the reply, or `null`. |
| `out` | The reply. |
| `meta` | The Seneca meta data of the reply: `meta.pattern`, `meta.id`, `meta.custom`, and on Seneca 4 `meta.err` for an error reply. |

Entries of the spec's `context` property are stored as given; they do
not need this shape.
