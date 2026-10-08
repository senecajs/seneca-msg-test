# seneca-msg-test documentation

The documentation follows the [Diátaxis](https://diataxis.fr/)
structure: four sections with four different jobs. Start with the
tutorial if you are new to the harness; use the how-to guides for
specific tasks; look things up in the reference; read the explanations
to understand the design.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started: test a plugin's messages declaratively](tutorials/getting-started.md) | A small plugin and its message test: seeded data, calls in order, a reference to an earlier reply, a Joi rule, an expected error, and a deliberate failure. |

The programs from the documentation are in [examples](examples/).

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Seed entity data for message tests](how-to/seed-entity-data.md) | The `data` layout, entities with and without a base, exporting data from a store, how seeded data merges. |
| [Reference earlier replies](how-to/reference-earlier-replies.md) | Naming calls, `` `name:out.id` `` in parameters and expected replies, paths, expressions, the `context` property. |
| [Use delegates with fixed arguments and custom meta data](how-to/use-delegates.md) | Named delegates, one-off delegates, computed delegates, delegates created while the spec runs. |
| [Assert on errors on Seneca 3 and 4](how-to/assert-on-errors.md) | The `err` property, what the error looks like on each Seneca version, version independent rules, silencing expected errors. |
| [Check replies with Joi rules and code](how-to/check-replies-with-joi-and-code.md) | Literal matching, Joi rules inside `out`, array replies, `params` functions, `verify` functions. |
| [Allow unlisted messages](how-to/allow-unlisted-messages.md) | The missing messages check and `allow.missing`. |
| [Debug a failing spec](how-to/debug-a-failing-spec.md) | Reading failure messages, `print`, `print_context`, `log`, `LN`, skipping calls. |
| [Run with lab, jest or mocha](how-to/run-with-lab-or-jest.md) | Using the returned test function with other runners, and closing the instance. |

## Reference

| Reference | Describes |
| --------- | --------- |
| [Test specification](reference/spec.md) | Every spec property and every call property, with type, default and effect; message assembly; matching rules; validation. |
| [Reference syntax](reference/references.md) | The `` `name:path` `` syntax, expressions, escaping, where references are resolved, the call record. |
| [API](reference/api.md) | `SenecaMsgTest(seneca, spec)`, the returned function, `Joi`, `LN`, `MsgTest`, `intern`, TypeScript types, dependencies. |
| [Failure messages](reference/failures.md) | Every message the harness fails with, and what it means. |

## Explanation

| Explanation | Topic |
| ----------- | ----- |
| [How the harness works](explanation/how-the-harness-works.md) | What happens from `SenecaMsgTest(seneca, spec)` to the last call: setup, seeding, the missing messages check, the call loop, the context. |
| [Why declarative message tests](explanation/why-declarative-message-tests.md) | The reasons for describing message tests as data, and the limits of the approach. |
| [Seneca 3 and Seneca 4](explanation/seneca-3-and-4.md) | `ready()` on 4.0.0-rc5, wrapped versus unwrapped errors, promises, peer dependencies. |

## Feature index

Every spec property, call property, syntax element and export, with
the page that specifies it and the guide that shows it in use.

| Feature | Reference | Guides |
| ------- | --------- | ------ |
| `SenecaMsgTest(seneca, spec)`, the returned test function, `test.run` | [API](reference/api.md#senecamsgtestseneca-spec) | [Getting started](tutorials/getting-started.md) |
| `MsgTest` export | [API](reference/api.md#other-exports) | |
| `Joi` export | [API](reference/api.md#other-exports) | [Check replies with Joi rules and code](how-to/check-replies-with-joi-and-code.md) |
| `LN` export (spec file locations) | [API](reference/api.md#other-exports) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| `intern` export (`ready`, `error_view`, `where`, `run`, `handle_delegate`, `missing_messages`) | [API](reference/api.md#other-exports) | |
| Spec `init` | [Spec properties](reference/spec.md#spec-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Spec `test`, `log` | [Spec properties](reference/spec.md#spec-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md), [Assert on errors](how-to/assert-on-errors.md) |
| Spec `print` | [Spec properties](reference/spec.md#spec-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Spec `data` (seeding through `role:mem-store,cmd:import`) | [Spec properties](reference/spec.md#spec-properties) | [Seed entity data](how-to/seed-entity-data.md) |
| Spec `context` | [Spec properties](reference/spec.md#spec-properties) | [Reference earlier replies](how-to/reference-earlier-replies.md) |
| Spec `pattern`, deprecated `fix` | [Spec properties](reference/spec.md#spec-properties), [Message assembly](reference/spec.md#message-assembly) | [Getting started](tutorials/getting-started.md) |
| Spec `delegates` | [Spec properties](reference/spec.md#spec-properties) | [Use delegates](how-to/use-delegates.md) |
| Spec `allow.missing`, the missing messages check | [Spec properties](reference/spec.md#spec-properties) | [Allow unlisted messages](how-to/allow-unlisted-messages.md) |
| Spec `calls` as an array or as a function of `LN` | [Spec properties](reference/spec.md#spec-properties), [Validation](reference/spec.md#validation) | [Getting started](tutorials/getting-started.md), [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Call `name` | [Call properties](reference/spec.md#call-properties) | [Reference earlier replies](how-to/reference-earlier-replies.md) |
| Call `pattern` | [Call properties](reference/spec.md#call-properties), [Message assembly](reference/spec.md#message-assembly) | [Getting started](tutorials/getting-started.md) |
| Call `params` as an object or a function | [Call properties](reference/spec.md#call-properties) | [Reference earlier replies](how-to/reference-earlier-replies.md), [Check replies with Joi rules and code](how-to/check-replies-with-joi-and-code.md) |
| Call `out` (object, array, `null`, Joi rules, references) | [Call properties](reference/spec.md#call-properties), [Matching](reference/spec.md#matching) | [Check replies with Joi rules and code](how-to/check-replies-with-joi-and-code.md) |
| Call `err` | [Call properties](reference/spec.md#call-properties), [Matching](reference/spec.md#matching) | [Assert on errors](how-to/assert-on-errors.md) |
| Call `delegate` as a name, an array or a function | [Call properties](reference/spec.md#call-properties) | [Use delegates](how-to/use-delegates.md) |
| Call `verify`, `call.result` | [Call properties](reference/spec.md#call-properties) | [Check replies with Joi rules and code](how-to/check-replies-with-joi-and-code.md) |
| Call `run` | [Call properties](reference/spec.md#call-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Call `print`, `print_context` | [Call properties](reference/spec.md#call-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Call `line` | [Call properties](reference/spec.md#call-properties) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| `` `name:path` `` references, `` `expression` ``, escaped backticks | [Reference syntax](reference/references.md) | [Reference earlier replies](how-to/reference-earlier-replies.md) |
| The call record (`out`, `err`, `params`, `msg`, `meta`, `pattern`, `top_pattern`) | [The call record](reference/references.md#the-call-record) | [Reference earlier replies](how-to/reference-earlier-replies.md) |
| Failure messages | [Failure messages](reference/failures.md) | [Debug a failing spec](how-to/debug-a-failing-spec.md) |
| Spec validation errors | [Validation](reference/spec.md#validation) | |
| Seneca 3 and Seneca 4 differences (`ready`, errors, promises) | [Seneca 3 and Seneca 4](explanation/seneca-3-and-4.md) | [Assert on errors](how-to/assert-on-errors.md) |
| Other test runners | | [Run with lab, jest or mocha](how-to/run-with-lab-or-jest.md) |

## Other documents

* [Change log](../CHANGES.md)
* [License](../LICENSE)
