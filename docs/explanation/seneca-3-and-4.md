# Seneca 3 and Seneca 4

seneca-msg-test 5 runs on Seneca 4 only. Seneca 3 users stay on
seneca-msg-test 4 (`npm install --save-dev seneca-msg-test@4`). This
page lists what differs between the two, what the harness does about
it, and what a spec written for Seneca 3 needs on Seneca 4.

| Topic | Seneca 3, seneca-msg-test 4 | Seneca 4, seneca-msg-test 5 |
| ----- | --------------------------- | --------------------------- |
| Promise API (`post`, `message`, promise `ready`) | Provided by seneca-promisify, which the harness loaded when `post` was missing. | Built in. The harness loads nothing, and the project needs no seneca-promisify. |
| Error replies in `act` callbacks | Wrapped: `message` and `msg` are `seneca: Action <pattern> failed: <message>.`, `code` is `act_execute`, the original error is `orig`, `details.message` is the original message. | The action's own error, as replied, with its own `message`, `code` and other properties. The wrapped description is `meta.err` of the reply. |
| Entity plugin | `seneca-entity`, loaded with `.use('entity')`. | `@seneca/entity` 29 or later, loaded with `.use('@seneca/entity')`. |
| Node.js | 18 or later. | 24 or later. |

## Errors

Seneca 3 wraps every action error in an `act_execute` error. Seneca 4
passes the action's error through to the `act` callback (and to a
rejected `post` promise) and attaches the wrapper to the reply's meta
data instead.

For the harness this changes what `err` is matched against. The match
uses a plain object view of the error, because the clone taken for
matching would lose the non-enumerable `message` of an `Error`. The view
has `message`, `name` and the enumerable properties, and presents
`orig` in the same form when the error carries the error it was built
from there. An expectation written for the Seneca 3 wrapper, such as
`{ code: 'act_execute', orig: { message: 'foo' } }`, no longer matches:
match the action's own error instead, `{ message: 'foo' }`. A Joi rule
on `message` that both message forms satisfy keeps working. See
[Assert on errors](../how-to/assert-on-errors.md).

## Promises

The harness needs `seneca.post` for its data import and
`seneca.ready()` to wait for the instance. Both are part of Seneca 4.
`await seneca.ready()` resolves at once on an instance that is already
idle, which is the usual case for instances created at file load time.
Seneca 4 still accepts the seneca-promisify plugin but warns that it is
deprecated (`SENECA_DEP_PROMISIFY`); remove `.use('promisify')` and the
dependency.

## The entity plugin

The entity plugin is published as `@seneca/entity` from version 29, the
first version that loads on Seneca 4. Version 28 and earlier were
published as `seneca-entity` and stop Seneca 4 at startup with
`plugin_gubu_shape`. Seneca resolves the short name in
`.use('entity')` to `seneca-entity` first when that package is
installed, so load the plugin by its full name,
`.use('@seneca/entity')`, and remove `seneca-entity` from the project.

## Peer dependencies

The peer dependencies are `seneca` `^4.0.0` and `@seneca/entity`
`^29.0.0`. The entity plugin is optional: the harness seeds `data`
with the message `role:mem-store,cmd:import`, which carries
`default$: {}`, so without the plugin the import does nothing and the
run continues.

## Running the test suite

The repository's own tests run on Seneca 4 with `@seneca/entity` 29.
See the Contributing section of the [README](../../README.md#contributing).
