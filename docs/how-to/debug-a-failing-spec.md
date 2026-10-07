# Debug a failing spec

How to find out why a call fails: read the failure message, print what
was sent and received, and locate the call in the spec file.

## 1. Read the failure message

A run rejects with one `Error` for the first failing call. Its message
starts with the kind of failure, then the call: the call's `name` (if
any) and a `~`, the message that was sent as a Jsonic string, and the
spec file location when `LN` is used:

```
Output for: pear~{name:pear,price:0.75,role:shop,cmd:add} (shop~6) was invalid: "price" must be [0.5]
```

The part after `was invalid:` is the Joi report for the first property
that did not match. Every message is listed in
[Failure messages](../reference/failures.md).

## 2. Print the message, error and reply

`print: true` on a call prints what was sent and what came back; on the
spec it does so for every call:

```js
{ print: true, pattern: 'cmd:add', params: { name: 'pear', price: 0.75 }, out: { name: 'pear' } },
```

```
CALL   :  cmd:add { name: 'pear', price: 0.75 }
ERROR  :  null
RESULT :  Entity {
  'entity$': '-/shop/item',
  name: 'pear',
  price: 0.75,
  id: 'dpyruk'
}
```

`CALL` shows the call pattern and the parameters after references were
resolved. `RESULT` is printed with `util.inspect` at full depth.

## 3. Print the reference context

`print_context: true` on a call prints the context as it is just before
the call runs: the `context` entries and the records of the named calls
so far (`console.dir` with depth 3). Use it when a reference resolves to
`null`: the record you expect may be missing or named differently.

## 4. Log every message

With `test: true` (the default) the instance is in test mode and logs at
level `warn`. Set `log: true` as well to log every message
(`seneca.test(null, 'print')`), including the messages the plugin sends
internally:

```js
module.exports = { pattern: 'role:shop', log: true, calls: [ ... ] }
```

## 5. Locate calls in the spec file with `LN`

Give `calls` as a function. It receives `LN`, which records the file
name and line of the call it wraps; the location then appears in failure
messages:

```js
module.exports = {
  pattern: 'role:shop',
  calls: (LN) => [
    LN({
      pattern: 'cmd:get',
      params: { id: 'i0' },
      out: { name: 'apple', price: 0.75 },
    }),
  ],
}
```

```
Output for: {id:i0,role:shop,cmd:get} (shop~5) was invalid: "price" must be [0.75]
```

The location is the file name up to its first dot (`shop` for
`shop.spec.js`), a `~`, and the line number. `LN()` without an argument
returns `',LN:<file>~<line>'`, which can be appended to a pattern string
(`pattern: 'cmd:get' + LN()`) so that the location travels inside the
message itself. `LN` reads the location from the stack trace and
recognizes `.js` files.

## 6. Narrow the run

* `run: false` on a call skips it (the following calls still run, so
  references to a skipped call resolve to `null`).
* `allow: { missing: true }` lets you run a spec with only the calls you
  are looking at (see [Allow unlisted messages](allow-unlisted-messages.md)).
* With the Node.js test runner, `node --test --test-name-pattern <name>`
  runs one test; this repository's `npm run test-some -- <name>` does the
  same.

## 7. Check the instance setup

If every call fails or the run never starts, check the instance:

* The spec's `init` function must return the instance.
* Seeded `data` needs the entity plugin on the instance (see
  [Seed entity data](seed-entity-data.md)).
* On Seneca 3, `seneca-promisify` must be installed; the harness loads
  it when the instance has no `post` method.
