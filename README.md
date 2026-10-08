# seneca-msg-test

Declarative tests for the messages of a Seneca plugin. A test
specification lists the messages to send, in order, and the replies or
errors to expect. The harness sends them to a Seneca instance one after
another, checks every reply, and reports the first mismatch together
with the message that caused it. It works with Seneca 3 and the Seneca 4
prerelease, on Node.js 18 or later (24 and 22 are tested), with any test
runner: `node:test`, lab, jest or mocha.

[![npm version][npm-badge]][npm-url]
[![build][build-badge]][build-url]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install --save-dev seneca-msg-test
```

The harness needs `seneca` (3.x, or 4.0.0-rc5 and later) and
`seneca-entity` in your project: it seeds test data through the entity
plugin's in-memory store. On Seneca 3 it also needs `seneca-promisify`,
which it loads when the instance has no `post` method. All three are
peer dependencies.

## Quick Example

A plugin with two messages, and a test that sends them in order. The
second call uses the `id` replied by the first:

```js
const { test, after } = require('node:test')

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

const seneca = Seneca({ log: 'silent' })
  .use('entity')
  .use(function color() {
    this.add('role:color,cmd:add', function (msg, reply) {
      this.make$('color/item')
        .data$({ name: msg.name, hex: msg.hex })
        .save$(reply)
    })
    this.add('role:color,cmd:get', function (msg, reply) {
      this.make$('color/item').load$(msg.id, reply)
    })
  })

const spec = {
  pattern: 'role:color',
  calls: [
    {
      name: 'red',
      pattern: 'cmd:add',
      params: { name: 'red', hex: '#f00' },
      out: { name: 'red', hex: '#f00' },
    },
    {
      pattern: 'cmd:get',
      params: { id: '`red:out.id`' }, // the id replied by the call named red
      out: { name: 'red' },
    },
  ],
}

test('color messages', SenecaMsgTest(seneca, spec))

after(() => seneca.close())
```

`SenecaMsgTest(seneca, spec)` returns an async function that runs the
calls and rejects on the first mismatch; pass it to your test runner.
The file is [docs/examples/quick-example.test.js](docs/examples/quick-example.test.js);
`node --test docs/examples/quick-example.test.js` prints:

```
✔ color messages (129.598804ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 460.230912
```

## More Examples

* [Getting started: test a plugin's messages declaratively](docs/tutorials/getting-started.md)
  builds a plugin and its message test step by step, with seeded data,
  references between calls, a Joi rule and an expected error.
* How-to guides:
  [seed entity data](docs/how-to/seed-entity-data.md),
  [reference earlier replies](docs/how-to/reference-earlier-replies.md),
  [use delegates with fixed arguments and custom meta data](docs/how-to/use-delegates.md),
  [assert on errors on Seneca 3 and 4](docs/how-to/assert-on-errors.md),
  [check replies with Joi rules and code](docs/how-to/check-replies-with-joi-and-code.md),
  [allow unlisted messages](docs/how-to/allow-unlisted-messages.md),
  [debug a failing spec](docs/how-to/debug-a-failing-spec.md),
  [run with lab, jest or mocha](docs/how-to/run-with-lab-or-jest.md).
* The programs from the documentation are in [docs/examples](docs/examples/).
  They run as they are: `node --test docs/examples/shop.test.js`.

## Motivation

A Seneca plugin is defined by the messages it handles, so its tests are
mostly the same three things repeated: send a message, wait for the
reply, compare. Writing each case as data (a pattern, parameters, the
expected reply) keeps the test readable and in order, lets a call use
the reply of an earlier one, and lets the harness check that every
pattern the plugin adds has a test. See
[Why declarative message tests](docs/explanation/why-declarative-message-tests.md)
and [How the harness works](docs/explanation/how-the-harness-works.md).

## Support

* Questions and bug reports: [GitHub issues](https://github.com/senecajs/seneca-msg-test/issues).
* Seneca documentation: [senecajs.org](https://senecajs.org) and the
  [Seneca 4 docs](https://github.com/senecajs/seneca/tree/master/docs).
* Commercial support: [Voxgig](https://www.voxgig.com).

## API

The full documentation is in [docs](docs/README.md).

| Export | Description | Reference |
| ------ | ----------- | --------- |
| `SenecaMsgTest(seneca, spec)` | Validates `spec`, returns an async function that runs it against `seneca` (or a new `Seneca().test()` instance). | [API](docs/reference/api.md#senecamsgtestseneca-spec) |
| `SenecaMsgTest.Joi` | The Joi instance used for matching; use it for rules inside `out` and `err`. | [API](docs/reference/api.md#other-exports) |
| `SenecaMsgTest.LN` | Records the spec file line of a call for failure messages. | [API](docs/reference/api.md#other-exports) |
| `SenecaMsgTest.MsgTest`, `SenecaMsgTest.intern` | The same function, and the internal steps (`run`, `missing_messages`, `handle_delegate`, `ready`, `error_view`, `where`). | [API](docs/reference/api.md#other-exports) |

| Spec property | Purpose | Reference |
| ------------- | ------- | --------- |
| `pattern` (`fix`) | Pattern merged into every message; scope of the missing messages check. | [Spec](docs/reference/spec.md#spec-properties) |
| `calls` | The messages to send, in order, as an array or a function of `LN`. | [Spec](docs/reference/spec.md#spec-properties) |
| `data` | Entities seeded into the in-memory store before the calls. | [Spec](docs/reference/spec.md#spec-properties) |
| `context` | Initial reference context; call records are added to it. | [Spec](docs/reference/spec.md#spec-properties) |
| `delegates` | Named `seneca.delegate(fixedargs, fixedmeta)` instances for calls. | [Spec](docs/reference/spec.md#spec-properties) |
| `init`, `test`, `log`, `print`, `allow.missing` | Instance setup, test mode, logging, printing, missing messages check. | [Spec](docs/reference/spec.md#spec-properties) |

| Call property | Purpose | Reference |
| ------------- | ------- | --------- |
| `pattern`, `params` | The message: pattern merged over the spec pattern and the parameters. | [Spec](docs/reference/spec.md#call-properties) |
| `out`, `err` | Expected reply or expected error, as literals, Joi rules and references. | [Spec](docs/reference/spec.md#call-properties), [Matching](docs/reference/spec.md#matching) |
| `name` | Stores the call record for references such as `` `name:out.id` ``. | [References](docs/reference/references.md) |
| `delegate`, `verify`, `run`, `print`, `print_context`, `line` | Delegate selection, custom checks, skipping, debugging. | [Spec](docs/reference/spec.md#call-properties) |

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features, please get in
touch.

The source is TypeScript in `src/`, compiled to `dist/` (which is
committed and published). The tests use the Node.js test runner and run
against the Seneca 4 prerelease (devDependency `seneca@^4.0.0-rc5`).
Node.js 24 is the default target; Node.js 22 is also tested.

```sh
npm install
npm run build
npm test
```

To test against an unreleased Seneca build, install its tarball without
saving it, then restore the prerelease; the same works for Seneca 3,
whose wrapped error format the test suite also understands:

```sh
npm install --no-save /path/to/seneca-4.0.0.tgz && npm test
npm install --no-save seneca@3 && npm test
npm install
```

Format code with `npm run prettier`. The continuous integration
workflow is delivered as a patch in [.patches](.patches/README.md)
(`git am .patches/*.patch`), because workflow files need a GitHub
`workflow` scope that the preparing session did not have.

## Background

seneca-msg-test was first published in 2018 by [Voxgig](https://www.voxgig.com)
to test the message interfaces of the Seneca plugins it maintains.
Version 4.2.0 adds support for the Seneca 4 prerelease, moves the tests
to the Node.js test runner, and reorganizes the documentation. Changes
between versions are listed in [CHANGES.md](CHANGES.md).

| Seneca | What differs | Node.js |
| ------ | ------------ | ------- |
| 3.x (tested with 3.38) | Needs `seneca-promisify` (loaded by the harness). Action errors reach `err` wrapped: `message` is `seneca: Action <pattern> failed: <message>.` and the original error is `err.orig`. | 18 or later (tested on 22 and 24) |
| 4.0.0-rc5 and 4.0.0 | Promises are built in. Action errors reach `err` as the action replied them. | 22 or later (a Seneca 4 requirement) |

See [Seneca 3 and Seneca 4](docs/explanation/seneca-3-and-4.md) for
the details, including the `ready()` workaround the harness applies for
4.0.0-rc5.

Licensed under [MIT](LICENSE).

[npm-badge]: https://badge.fury.io/js/seneca-msg-test.svg
[npm-url]: https://www.npmjs.com/package/seneca-msg-test
[build-badge]: https://github.com/senecajs/seneca-msg-test/actions/workflows/build.yml/badge.svg
[build-url]: https://github.com/senecajs/seneca-msg-test/actions/workflows/build.yml
