# Seed entity data for message tests

How to start a run with known entities in the store, so that calls such
as `cmd:get` and `cmd:list` have data to work with.

## What you need

The instance must use the entity plugin (`seneca-entity`), whose default
store is the in-memory `mem-store`. The harness sends the `data`
property of the spec to that store with the message
`role:mem-store,cmd:import` before the first call. The message carries
`default$: {}`, so without the entity plugin the import does nothing and
the run continues.

## 1. Describe the entities

`data` uses the layout of the store itself: base, then name, then id,
then the entity's properties.

```js
module.exports = {
  pattern: 'role:shop',
  data: {
    shop: {
      item: {
        i0: { entity$: '-/shop/item', id: 'i0', name: 'apple', price: 0.5 },
        i1: { entity$: '-/shop/item', id: 'i1', name: 'pear', price: 0.75 },
      },
    },
  },
  calls: [
    { pattern: 'cmd:get', params: { id: 'i1' }, out: { name: 'pear' } },
    { pattern: 'cmd:list', params: {}, out: [{ id: 'i0' }, { id: 'i1' }] },
  ],
}
```

The entity canon `-/shop/item` is zone, base and name; the plugin
creates these entities with `this.make$('shop/item')`. The key is the
id the store looks up; give the entity the same `id`.

Entities without a base, such as `this.make$('todo')` (canon
`-/-/todo`), are stored under the key `undefined`, because the store
indexes by base and the base of such an entity is undefined:

```js
data: {
  undefined: {
    todo: {
      t0: { entity$: '-/-/todo', id: 't0', text: 'buy milk', done: false },
    },
  },
},
```

## 2. Get the layout from a running store

If you already have a store with the right content, export it:

```js
const out = await seneca.post('role:mem-store,cmd:export')
console.log(out.json)
```

The parsed `json` is a valid `data` value. For the two entities above
it looks like this:

```
{"undefined":{"todo":{"t0":{"entity$":"-/-/todo","text":"buy milk","done":false,"id":"t0"}}},"foo":{"bar":{"b0":{"entity$":"-/foo/bar","b":0,"id":"b0"}}}}
```

## 3. Know how the data merges

The import uses `merge: true`: `data` is deep merged into whatever the
store already holds. Entities saved by earlier calls, or seeded by an
earlier spec run against the same instance, stay in the store. If a run
must start from a clean store, use a fresh instance for it.

`list$` returns entities in the order they were stored: seeded entities
first, in the order of the keys, then the entities saved during the run.
The `cmd:list` expectation above relies on that order.

## 4. Combine seeded and created entities

Ids generated during the run are not known when the spec is written.
Name the call that creates the entity and reference its reply (see
[Reference earlier replies](reference-earlier-replies.md)):

```js
{ name: 'kiwi', pattern: 'cmd:add', params: { name: 'kiwi', price: 1 }, out: { name: 'kiwi' } },
{ pattern: 'cmd:list', params: {}, out: [{ id: 'i0' }, { id: 'i1' }, { id: '`kiwi:out.id`' }] },
```
