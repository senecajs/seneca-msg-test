# Changes

## 4.2.0 2026-10-07

* Seneca 4 prerelease support. The test suite runs against
  `seneca@4.0.0-rc5` (devDependency) and the unreleased 4.0.0, and
  still passes against Seneca 3.38. The peer dependency range is
  `>=3 || >=4.0.0-rc5` (a bare `>=3` excluded the prerelease).
* The harness waits for the instance with the callback form of `ready`.
  On `seneca@4.0.0-rc5`, `await seneca.ready()` never resolves when the
  instance is already idle, which is the usual case for instances
  created at file load time, so every test after the first hung until
  the runner timeout.
* `seneca-promisify` is loaded only when the instance has no `post`
  method (Seneca 3). Seneca 4 provides `post` in core, where the plugin
  is a no-op.
* Expected errors (`err`) are matched against a plain object view of the
  error that includes the non-enumerable `message` and `name`, and, on
  Seneca 3, the original error `orig` in the same form. Previously the
  clone taken for matching lost `message`, so `err: { message: ... }`
  could not match; on Seneca 4, where action errors are passed through
  unwrapped, `message` is the property to assert on.
* An `err` mismatch is reported as
  `Error for: <call> was invalid: <reason>` instead of the raw Joi
  validation error.
* Failure messages include the spec file location recorded by `LN`.
* The call schema accepts `run: false` (skip a call) and `out: null`
  (assert that there is no reply); both were implemented but rejected
  by the validation when `calls` was an array.
* `require('seneca-msg-test').intern` is exported as documented; it was
  overwritten by the module export before.
* Node.js 18 or later (`engines.node`); tested on 24 and 22.
* Tests moved from `@hapi/lab` 23 to the Node.js test runner
  (`node --test` with coverage). The lab, code and coveralls
  devDependencies, the `.travis.yml` file and the generated
  `test/coverage.html` and `test/lcov.info` files are removed;
  `@types/node` is added for the TypeScript build.
* Documentation reorganized in the Diátaxis structure under `docs/`
  (tutorial, how-to guides, reference, explanation) with runnable
  examples in `docs/examples`; the old `example` folder is replaced by
  them.
* Continuous integration workflow for Node.js 24 and 22 provided as a
  patch in `.patches` (see `.patches/README.md`).

## 4.1.0 and earlier

Earlier versions were not recorded in a change log; see the git history.
