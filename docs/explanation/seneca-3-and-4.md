# Seneca 3 and Seneca 4

The harness supports Seneca 3 and the Seneca 4 prerelease
(4.0.0-rc5 and later). This page lists what differs between the two,
what the harness does about it, and what a spec author has to do.

| Topic | Seneca 3 (3.38 tested) | Seneca 4 (4.0.0-rc5 and 4.0.0 tested) |
| ----- | ---------------------- | ------------------------------------- |
| Promise API (`post`, `message`, promise `ready`) | Provided by seneca-promisify, which the harness loads when `post` is missing. | Built in; seneca-promisify is a no-op and not needed. |
| `await seneca.ready()` | Resolves. | Never resolves on 4.0.0-rc5 when the instance is already idle (fixed in 4.0.0). The harness uses the callback form. |
| Error replies in `act` callbacks | Wrapped: `message` and `msg` are `seneca: Action <pattern> failed: <message>.`, `code` is `act_execute`, the original error is `orig`, `details.message` is the original message. | The action's own error, as replied, with its own `message`, `code` and other properties. The wrapped description is `meta.err` of the reply. |
| Node.js | 18 or later for the harness (tested on 22 and 24). | 22 or later (a Seneca 4 requirement). |

## The `ready()` workaround

A test file usually creates its Seneca instances at load time, one per
test, and the harness awaits readiness when the test runs. By then the
instance has loaded its plugins and is idle. On seneca@4.0.0-rc5,
`await seneca.ready()` waits for a later "queue cleared" event that an
idle instance never emits, so every test after the first hung until the
runner's timeout. The callback form, `seneca.ready(fn)`, checks the
executor directly and calls `fn` promptly on an idle instance, on every
Seneca version. The harness therefore waits with

```js
await new Promise((resolve) => seneca.ready(() => resolve()))
```

in both places where it waits (after creation, and after loading
seneca-promisify). Seneca 4.0.0 fixes the promise form; the callback
form remains correct there. Test code that awaits `ready()` on its own
instances should do the same while it may run on rc5.

## Errors

Seneca 3 wraps every action error in an `act_execute` error. Seneca 4
passes the action's error through to the `act` callback (and to a
rejected `post` promise) and attaches the wrapper to the reply's meta
data instead.

For the harness this changes what `err` is matched against. The match
uses a plain object view of the error, because the clone taken for
matching would lose the non-enumerable `message` of an `Error`. The view
has `message`, `name` and the enumerable properties; on Seneca 3 it also
presents `orig` in the same form, so `orig.message` can be matched. A
spec that must run on both versions either chooses the expectation by
version or uses a Joi rule that both message forms satisfy; see
[Assert on errors on Seneca 3 and 4](../how-to/assert-on-errors.md).

## Promises and seneca-promisify

The harness needs `seneca.post` for its data import. It checks for the
method rather than for the plugin: on Seneca 4 nothing is loaded, on
Seneca 3 seneca-promisify is loaded and the harness waits for ready
once more. seneca-promisify therefore remains a peer dependency for
Seneca 3 users only.

## Peer dependency range

The peer range for seneca is `>=3 || >=4.0.0-rc5`. A bare `>=3`
excludes prereleases under npm's semver rules, which made
`npm install` fail with `ERESOLVE` in projects that use the Seneca 4
prerelease. The range resolves to 4.0.0 once it is published.

## Running the test suite on either version

The repository's own tests choose their error expectations by version
and pass on seneca 3.38, 4.0.0-rc5 and 4.0.0. See the Contributing
section of the [README](../../README.md#contributing).
