# Allow unlisted messages

How to run a spec that does not cover every message of the plugin, and
what the missing messages check does.

## The check

Before the first call, the harness lists the patterns of the instance
under the spec's `pattern` (`seneca.list(spec.pattern)`) and removes
every pattern that a call resolves to (`seneca.find` on the merged
pattern of each call). Patterns that remain have no call, and the run
fails before any message is sent:

```
Test calls not defined for: cmd:zed,role:plugin0; cmd:qaz,role:plugin0
```

Two details of `seneca.list` matter here:

* Without a top level `pattern`, the empty pattern lists every pattern
  of the instance, including Seneca's own (`sys:seneca,cmd:close`, the
  entity and store messages, plugin definition and init patterns), so a
  spec without `pattern` always has missing messages.
* Patterns with a wildcard value, such as `role:plugin0,red:*`, are not
  listed under `role:plugin0`, so they are never reported as missing.

## 1. Cover the messages

The check exists to catch messages that were added to the plugin without
a test. The first answer is to add a call for each pattern listed in the
failure message.

## 2. Or allow missing messages

When a spec is meant to cover part of a plugin, or it has no top level
`pattern`, set `allow.missing`:

```js
module.exports = {
  pattern: 'role:shop',
  allow: { missing: true },
  calls: [
    { pattern: 'cmd:get', params: { id: 'i0' }, out: { name: 'apple' } },
  ],
}
```

The check is then skipped and only the listed calls run.

## 3. Split a plugin's messages over several specs

Each spec is checked on its own, so a plugin whose messages are split
over several spec files needs `allow.missing: true` in each of them, or
one spec per `pattern` scope: `pattern: 'role:shop,cmd:get'` lists only
the patterns under that scope.
