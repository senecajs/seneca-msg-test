# Why declarative message tests

A Seneca plugin is defined by the messages it handles: each pattern it
adds is a public interface, and the reply to each message is the
behaviour that other plugins depend on. Testing a plugin therefore means
sending messages and comparing replies, over and over. The harness exists
to make that repetition data instead of code.

## A test case is a message and a reply

Written by hand, every case looks the same: build a message, send it,
wait, compare some properties of the reply, pass values on to the next
case. The variable parts are the pattern, the parameters and the
expected reply, which is exactly what a call in a spec holds. The fixed
parts (sending, waiting, comparing, carrying values forward, reporting)
are written once, in the harness.

This has a practical effect on reading tests. A spec reads as a story
about the plugin: add an item, get it, list the items, price an order,
ask for an item that does not exist. There is no control flow to follow.

## Partial expectations

`out` lists the properties that matter and ignores the rest. Replies
from a store carry ids, canon markers and timestamps that a test should
not have to repeat; a test that lists them breaks when they change for
reasons unrelated to the behaviour under test. Where a value is
unpredictable but constrained, a Joi rule says so.

## Replies feed later messages

Ids are generated; the id of the item you add is the id you must get.
References such as `` `pear:out.id` `` make that dependency explicit in
the data, without variables and callbacks. The reference context also
gives `verify` functions a complete record of what happened so far.

## The harness knows the plugin's patterns

Because the harness has the instance, it can list the patterns the
plugin added and compare them with the calls. A message that was added
to the plugin without a test fails the run with its pattern. Hand
written tests cannot offer this check; it is the main reason to give the
harness the instance rather than a function that sends messages.

## Limits

* Calls run one after another. The harness does not test concurrency,
  timeouts or ordering under load.
* A spec is a list, not a program: branching and loops belong in
  `params`, `delegate` and `verify` functions, or in several specs.
* Only the first failure is reported per run. That keeps the report
  short and the cause clear, at the cost of a second run to see the next
  problem.
* Matching is structural. Replies that are not objects or arrays
  (strings, numbers) are not supported by `out`; check them in `verify`.
