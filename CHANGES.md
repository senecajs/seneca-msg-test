# Changes

## 5.0.0 2026-11-20

4.2.0 was prepared but not published; its changes, listed below, are
part of this version, except where this entry replaces them.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3 || >=4.0.0-rc5`). Seneca 3 users stay on `seneca-msg-test@4`.
* Node.js 24 or later (`engines.node` `>=24`, was `>=18`).
* The entity peer dependency is `@seneca/entity` `^29.0.0`, and it is
  optional: without the entity plugin, `data` is not seeded. The peer
  dependency `seneca-entity` `>=25` is removed. npm installed
  seneca-entity 28 for it in every project that used the harness, and
  that version stops Seneca 4 at startup with `plugin_gubu_shape`.
* The peer dependency `seneca-promisify` is removed, and the harness no
  longer loads the plugin when the instance has no `post` method.
  Seneca 4 has promises built in and deprecates the plugin (D4).
* The harness waits for the instance with `await seneca.ready()`. The
  callback form was a workaround for 4.0.0-rc5, where the promise form
  never resolved on an idle instance; 4.0.0 fixes that.
* The documentation and the tests load the entity plugin by its full
  name, `.use('@seneca/entity')` (B14), and name the delegate argument
  `fixedmsg`, as Seneca 4 does (D6). The tests no longer load
  `seneca-promisify` and no longer carry Seneca 3 error expectations.
  "Assert on errors" and "Seneca 3 and Seneca 4" explain how to convert
  a spec written for Seneca 3.
* The coverage threshold of `npm test` (80% of lines) is measured on
  `dist/`, the code of this package. Before, it also counted Seneca and
  the entity plugin whenever they were linked from outside
  `node_modules`.
* devDependencies: `seneca` `^4.0.0` and `@seneca/entity` `^29.0.0`
  replace `seneca` `^4.0.0-rc5`, `seneca-entity` and `seneca-promisify`.
* `package-lock.json` is no longer committed. `repository`, `bugs` and
  `homepage` point to `senecajs/seneca-msg-test`, and `publishConfig`
  sets public access.

## 4.2.0 2026-10-07 (not published)

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
* The test function can run more than once with named `delegates`:
  each run builds the delegates from their definitions. Before, the
  first run replaced the definitions with the built delegates, so a
  second run lost their fixed arguments.
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
