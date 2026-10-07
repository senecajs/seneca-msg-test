# Use delegates with fixed arguments and custom meta data

How to send calls through a Seneca delegate, so that the actions see
fixed message properties (`fixedargs`) and custom meta data
(`fixedmeta.custom`), for example the user or tenant a message belongs
to.

The plugin used below echoes what it sees:

```js
seneca.add('role:note,cmd:add', function (msg, reply, meta) {
  reply({ text: msg.text, user: msg.user, tenant: meta.custom.tenant })
})
```

## 1. Define named delegates

Each entry of `delegates` is the argument list of
`seneca.delegate(fixedargs, fixedmeta)`. The delegates are created once
the instance is ready, before the first call.

```js
module.exports = {
  pattern: 'role:note',
  delegates: {
    alice: [{ user: 'alice' }, { custom: { tenant: 'acme' } }],
    bob: [{ user: 'bob' }, { custom: { tenant: 'globex' } }],
  },
  calls: [ ... ],
}
```

## 2. Select a delegate per call

```js
{
  delegate: 'alice',
  pattern: 'cmd:add',
  params: { text: 'a' },
  out: { text: 'a', user: 'alice', tenant: 'acme' },
},
{
  delegate: 'bob',
  pattern: 'cmd:add',
  params: { text: 'b' },
  out: { user: 'bob', tenant: 'globex' },
},
```

The message is sent with `alice.act(msg, ...)`, so `msg.user` is
`'alice'` and `meta.custom.tenant` is `'acme'` inside the action. A
name that is not defined fails the call with
`Delegate not defined: <name>. Message was: <msg>`.

## 3. Create a delegate for one call

An array creates a new delegate for that call only:

```js
{
  delegate: [{ user: 'carol' }, { custom: { tenant: 'initech' } }],
  pattern: 'cmd:add',
  params: { text: 'c' },
  out: { user: 'carol', tenant: 'initech' },
},
```

## 4. Compute the delegate from earlier replies

A function receives `(call, context, spec)` with `this` bound to the
instance, and returns the instance to use:

```js
{
  delegate: function (call, context) {
    return this.delegate(
      { user: context.login.out.user },
      { custom: { tenant: 'hooli' } }
    )
  },
  pattern: 'cmd:add',
  params: { text: 'f' },
  out: { user: 'dave', tenant: 'hooli' },
},
```

## 5. Add delegates while the spec runs

Named delegates are resolved when each call runs, so a `verify`
function can add one for the calls that follow, for example after a
login message:

```js
{
  name: 'login',
  pattern: 'cmd:add',
  params: { text: 'd', user: 'dave' },
  out: { user: 'dave' },
  verify: function (call, context, spec, seneca) {
    spec.delegates.session = seneca.delegate(
      { user: call.out.user },
      { custom: { tenant: 'umbrella' } }
    )
  },
},
{
  delegate: 'session',
  pattern: 'cmd:add',
  params: { text: 'e' },
  out: { user: 'dave', tenant: 'umbrella' },
},
```

`verify` returning `undefined` counts as a pass.
