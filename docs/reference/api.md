# API

Everything exported by `require('seneca-msg-test')`.

## `SenecaMsgTest(seneca, spec)`

```js
const SenecaMsgTest = require('seneca-msg-test')

const run = SenecaMsgTest(seneca, spec)   // or SenecaMsgTest(spec)
await run()
```

| Argument | Description |
| -------- | ----------- |
| `seneca` | Optional. A Seneca instance (recognized by its `seneca` property). When omitted, a new `Seneca().test()` instance is created from the `seneca` module resolved from seneca-msg-test. |
| `spec` | The [test specification](spec.md). Validated at once; an invalid spec throws the Joi error. |

The call validates the spec, calls `spec.init(seneca)` if present (its
return value becomes the instance), and returns `run`: an async function
with no parameters that performs one run of the spec:

1. Wait until the instance is ready (callback form of `seneca.ready`).
2. If `spec.test` is true, enter test mode: `seneca.test(null, spec.log ? 'print' : null)`.
3. If the instance has no `post` method (Seneca 3 without
   seneca-promisify), load `seneca-promisify` and wait for ready again.
4. Load `spec.data` with `role:mem-store,cmd:import` (`merge: true`,
   `default$: {}`).
5. Resolve `calls` (call the function with `LN` if it is one).
6. Run the missing messages check unless `spec.allow.missing` is true.
7. Create the named delegates of `spec.delegates`.
8. Run the calls in order; the promise resolves after the last call and
   rejects with the first failure (see [Failure messages](failures.md)).

The function neither creates nor closes the instance's resources beyond
this; close the instance in your test's teardown. `run.run` is
`intern.run` (below).

## Other exports

| Export | Description |
| ------ | ----------- |
| `SenecaMsgTest.MsgTest` | The same function, for code that prefers a named property. |
| `SenecaMsgTest.Joi` | The Joi instance that performs the matching (`@hapi/joi` 17, provided by the `optioner` dependency). Build the rules used inside `out` and `err` with it. |
| `SenecaMsgTest.LN(call)` | Records the location of the caller. With a call object: sets `call.line` to `file~line` and returns the call. Without an argument: returns `',LN:file~line'`, to append to a pattern string. `file` is the file name up to its first dot (`shop` for `shop.spec.js`); the location is read from the stack trace and recognizes `.js` files. `calls` functions receive it as their argument. |
| `SenecaMsgTest.intern` | The internal steps, exposed for extension and testing: `ready(seneca)` (promise over the callback form of `seneca.ready`), `error_view(err)` (the plain object view used to match `err`), `where(call)` (the ` (file~line)` suffix of failure messages), `run(seneca, spec, calls)` (the call loop), `handle_delegate(instance, call, context, spec)` (selects the instance for a call), `missing_messages(seneca, spec, calls)` (the check, throws on missing patterns). |

## TypeScript

The package ships `dist/msg-test.d.ts`. The types are permissive
(`any` based):

```ts
declare function msg_test(seneca: any, spec: any): {
    (): Promise<void>;
    run: (seneca: any, spec: any, calls: any) => Promise<unknown>;
};
declare namespace msg_test {
    var MsgTest: typeof msg_test;
    var Joi: any;
    var LN: (t: any) => any;
    var intern: { ... };
}
export default msg_test;
```

The module is CommonJS; `require('seneca-msg-test')` returns the
function itself.

## Dependencies

| Package | Role |
| ------- | ---- |
| `inks` | Resolves `` `name:path` `` references. |
| `jsonic` | Parses pattern strings and prints messages. |
| `optioner` | Validates the spec and matches replies and errors; provides `Joi`. |
| `seneca` (peer, `>=3 || >=4.0.0-rc5`) | The instance under test; also created by the harness when none is given. |
| `seneca-entity` (peer, `>=25`) | The entity plugin whose in-memory store receives `data`. |
| `seneca-promisify` (peer, `>=2`) | Loaded on Seneca 3 when the instance has no `post`. Not needed on Seneca 4. |
