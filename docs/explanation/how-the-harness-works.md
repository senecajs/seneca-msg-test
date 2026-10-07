# How the harness works

What happens between `SenecaMsgTest(seneca, spec)` and the last call,
and why the steps are ordered as they are.

## Two phases

`SenecaMsgTest(seneca, spec)` does the synchronous part: it validates
the spec, creates a `Seneca().test()` instance when none was given, and
calls `spec.init`. Nothing is sent yet. This is what makes
`test('name', SenecaMsgTest(seneca, spec))` possible at module load
time: test runners collect their tests first and run them later, and
the Seneca instance is often created in the same file, before any
runner hook has run.

The returned function does the asynchronous part, once per call. It is
plain `async function test()`, so every runner that accepts a promise
returning test body accepts it.

## Setup, in order

1. **Ready.** The instance may still be loading plugins. The harness
   waits with the callback form of `seneca.ready`, which also works on
   seneca@4.0.0-rc5, where the promise form never resolves for an idle
   instance (see [Seneca 3 and Seneca 4](seneca-3-and-4.md)).
2. **Test mode.** If `test` is true, `seneca.test()` is applied. It
   gives readable logs at level `warn` and callpoints, which is what you
   want when a call fails; `test: false` keeps whatever the test
   configured.
3. **Promises.** The harness uses `seneca.post` for its own message.
   Seneca 4 has it; on Seneca 3 the harness loads seneca-promisify and
   waits for ready again.
4. **Data.** `spec.data` is sent to the store as one import message, so
   that seeding is a single step that works for any amount of data, and
   with `default$: {}` so that an instance without the entity plugin is
   not an error.
5. **Calls.** If `calls` is a function it is called now, with `LN`, so
   that each run gets fresh call objects.
6. **Missing messages.** The instance's patterns under `spec.pattern`
   are compared with the calls. This runs before the calls, so a plugin
   message without a test fails fast and with a list, instead of being
   silently untested.
7. **Delegates.** The named delegates are created from the ready
   instance.

## The call loop

Calls run strictly one after another: the next call starts only when
the previous one has replied and passed its checks. This is deliberate.
Message tests describe a story (add, then get, then list), each step
depends on the state left by the previous one, and the first failure is
the one worth reporting.

For each call the harness:

1. Resolves `params`: references through Inks, or the `params`
   function.
2. Builds the message: params, then the spec pattern, then the call
   pattern, the later winning.
3. Picks the instance: the spec's instance, or the delegate selected by
   `delegate`.
4. Sends it with `act` and waits for the callback, which is the only way
   to receive the reply's `meta` data.
5. Stores the call record under `name` if there is one, before any
   check, so that `out` can reference the call's own reply.
6. Checks `err`, then `out`, then runs `verify`, failing with a message
   that names the call.
7. Stores the record again and moves to the next call on
   `setImmediate`, so that a long spec does not grow the stack.

## The reference context

The context is the spec's `context` object itself. Named call records
are added to it as the run proceeds, which is why references can only
point backwards (or to the current call in `out`), and why `params`,
`delegate` and `verify` functions receive it as an argument: they see
exactly what a backtick reference would see.

## What the harness leaves to the test

* Creating and closing the instance. The harness never closes the
  instance, so one instance can serve several specs.
* Choosing the runner and the reporting.
* Deciding how strict to be: `out` lists what matters, and anything the
  spec does not mention is not checked.
