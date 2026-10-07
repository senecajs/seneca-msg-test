/* Copyright (c) 2018-2026 Voxgig and other contributors, MIT License */
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const SenecaMsgTest = require('../')
const Seneca = require('seneca')

// Use the Joi instance of the harness so that versions match.
const Joi = SenecaMsgTest.Joi

// Seneca 3 wraps action errors ("seneca: Action ... failed: ...");
// Seneca 4 passes the action's own error through unchanged.
const SENECA3 = require('seneca/package.json').version.startsWith('3.')

test(
  'happy',
  run_spec(
    seneca_instance({ log: 'silent' }, function (seneca) {
      return seneca.use(function plugin0() {
        this.add('role:plugin0,cmd:zed', function (msg, reply) {
          this.make$('foo/bar').load$(msg.bid, reply)
        })
          .add('role:plugin0,cmd:qaz', function (msg, reply) {
            reply({ x: 1, y: msg.y, b: msg.b })
          })
          .add('role:plugin0,red:*', function (msg, reply) {
            reply({ r: msg.red, nm: msg.n.m, x: 1 })
          })
      })
    }),
    {
      test: true,
      data: {
        foo: {
          bar: {
            b0: { entity$: '-/foo/bar', id: 'b0', b: 0 },
            b1: { entity$: '-/foo/bar', id: 'b1', b: 1 },
          },
        },
      },
      pattern: 'role:plugin0',
      calls: [
        {
          name: 'zed0',
          pattern: 'cmd:zed',
          params: { bid: 'b0' },
          out: { b: 0 },
        },
        {
          name: 'qaz0',
          pattern: 'cmd:qaz',
          params: { y: 'a', b: '`zed0:out.b`' },
          out: { x: 1, y: 'a', b: 0 },
        },
        {
          pattern: 'red:1',
          params: { n: { m: '`zed0:out.b`' } },
          out: { r: Joi.number().required(), nm: 0, x: '`qaz0:out.x`' },
        },
      ],
    }
  )
)

test('declarative', async () => {
  await SenecaMsgTest(require('./declarative'))()
})

test('missing-calls', async (t) => {
  var si = seneca_instance({ log: 'silent' }, function (seneca) {
    return seneca.use(function plugin0() {
      this.add('role:plugin0,cmd:zed', () => {})
        .add('role:plugin0,cmd:qaz', () => {})
        .add('role:plugin0,red:*', () => {})
    })
  })
  t.after(() => close(si))

  await assert.rejects(
    SenecaMsgTest(si, {
      test: true,
      pattern: 'role:plugin0',
      calls: [],
    })(),
    {
      message:
        'Test calls not defined for: ' +
        'cmd:zed,role:plugin0; cmd:qaz,role:plugin0',
    }
  )

  // allow.missing allows missing calls
  await SenecaMsgTest(si, {
    test: true,
    pattern: 'role:plugin0',
    allow: {
      missing: true,
    },
    calls: [],
  })()
})

test(
  'delegates',
  run_spec(
    seneca_instance({ log: 'silent' }, function (seneca) {
      return seneca.use(function plugin0() {
        this.add('role:plugin0,cmd:qaz', function (msg, reply, meta) {
          reply({ x: 1, y: msg.y, z: meta.custom.z, w: msg.w })
        })
      })
    }),
    {
      test: true,
      print: false,
      delegates: {
        d0: [{ w: 'AA' }, { custom: { z: 'A' } }],
        d1: [{ w: 'BB' }, { custom: { z: 'B' } }],
      },
      pattern: 'role:plugin0',
      calls: [
        {
          delegate: 'd0',
          pattern: 'cmd:qaz',
          params: { y: 'a' },
          out: { x: 1, y: 'a', z: 'A', w: 'AA' },
        },
        {
          delegate: 'd1',
          pattern: 'cmd:qaz',
          params: { y: 'b' },
          out: { x: 1, y: 'b', z: 'B', w: 'BB' },
        },
        {
          delegate: 'd0',
          pattern: 'cmd:qaz',
          params: { y: 'c' },
          out: { x: 1, y: 'c', z: 'A', w: 'AA' },
        },
        {
          delegate: 'd1',
          pattern: 'cmd:qaz',
          params: { y: 'd' },
          out: { x: 1, y: 'd', z: 'B', w: 'BB' },
        },
        {
          delegate: [{ w: 'CC' }, { custom: { z: 'C' } }],
          pattern: 'cmd:qaz',
          params: { y: 'e' },
          out: { x: 1, y: 'e', z: 'C', w: 'CC' },
        },
      ],
    }
  )
)

test(
  'data-sequence',
  run_spec(
    seneca_instance({ log: 'silent' }, function (seneca) {
      return seneca.use(function foo() {
        this.add('role:foo,cmd:add', function (msg, reply) {
          this.make$('foo').data$(msg.data).save$(reply)
        })
          .add('role:foo,cmd:get', function (msg, reply) {
            this.make$('foo').load$(msg.id, reply)
          })
          .add('role:foo,cmd:list', function (msg, reply) {
            this.make$('foo').list$(msg.q, reply)
          })
          .add('role:foo,cmd:err', function (msg, reply) {
            reply(new Error(msg.text))
          })
          .add('role:foo,cmd:fail', function (msg, reply) {
            const err = new Error(msg.text)
            err.code = 'foo_failed'
            err.details = { text: msg.text }
            reply(err)
          })
      })
    }),
    {
      print: false,
      test: false,
      data: {},
      pattern: 'role:foo',
      calls: [
        {
          name: 'foo/a1',
          pattern: 'cmd:add',
          params: { data: { a: 1, b: 'A' } },
          out: { entity$: '-/-/foo', a: 1, b: 'A' },
        },
        {
          pattern: 'cmd:get',
          params: { id: '`foo/a1:out.id`' },
          out: { entity$: '-/-/foo', a: 1, b: 'A' },
        },
        {
          pattern: 'cmd:list',
          params: { q: { a: 1 } },
          out: [{ a: 1 }],
        },

        {
          pattern: 'cmd:list',
          // deep deref
          params: { q: { id: '`foo/a1:out.id`' } },
          out: [{ a: 1 }],
        },
        {
          pattern: 'cmd:err',
          params: { text: 'foo' },
          err: SENECA3
            ? // Seneca 3: the wrapped error, with the original in `orig`
              {
                message: 'seneca: Action cmd:err,role:foo failed: foo.',
                msg: 'seneca: Action cmd:err,role:foo failed: foo.',
                code: 'act_execute',
                orig: { message: 'foo' },
                details: { message: 'foo' },
              }
            : // Seneca 4: the error the action replied with
              { message: 'foo', name: 'Error' },
        },
        {
          pattern: 'cmd:fail',
          params: { text: 'bar' },
          err: SENECA3
            ? {
                code: 'act_execute',
                orig: { message: 'bar', code: 'foo_failed' },
              }
            : { message: 'bar', code: 'foo_failed', details: { text: 'bar' } },
        },
        {
          pattern: 'cmd:err',
          params: { text: 'zed' },
          // Joi rules work on both Seneca versions
          err: { message: Joi.string().pattern(/zed/) },
        },
      ],
    }
  )
)

test('error-mismatch', async (t) => {
  var si = seneca_instance({ log: 'silent' }, function (seneca) {
    return seneca.use(function plugin0() {
      this.add('role:plugin0,cmd:err', function (msg, reply) {
        reply(new Error('foo'))
      })
    })
  })
  t.after(() => close(si))

  await assert.rejects(
    SenecaMsgTest(si, {
      test: false,
      pattern: 'role:plugin0',
      calls: [
        {
          pattern: 'cmd:err',
          err: { message: 'not-foo' },
        },
      ],
    })(),
    {
      message:
        'Error for: {role:plugin0,cmd:err} was invalid: ' +
        '"message" must be [not-foo]',
    }
  )

  await assert.rejects(
    SenecaMsgTest(si, {
      test: false,
      pattern: 'role:plugin0',
      calls: [
        {
          pattern: 'cmd:err',
          out: { x: 1 },
        },
      ],
    })(),
    {
      // Seneca 3 wraps the message; Seneca 4 passes it through
      message:
        /^Error not expected for: \{role:plugin0,cmd:err\}, err: Error: .*foo/,
    }
  )
})

test('no-output', async (t) => {
  var si = seneca_instance({ log: 'silent' }, function (seneca) {
    return seneca.use(function plugin0() {
      this.add('role:plugin0,cmd:nothing', function (msg, reply) {
        reply()
      }).add('role:plugin0,cmd:something', function (msg, reply) {
        reply({ x: 1 })
      })
    })
  })
  t.after(() => close(si))

  // out: null asserts that there is no reply; run: false skips a call
  await SenecaMsgTest(si, {
    test: false,
    pattern: 'role:plugin0',
    calls: [
      { pattern: 'cmd:nothing', out: null },
      { pattern: 'cmd:something', out: { x: 2 }, run: false },
      { pattern: 'cmd:something', out: { x: 1 } },
    ],
  })()

  await assert.rejects(
    SenecaMsgTest(si, {
      test: false,
      pattern: 'role:plugin0',
      allow: { missing: true },
      calls: [{ pattern: 'cmd:something', out: null }],
    })(),
    {
      message:
        'Output not expected for: {role:plugin0,cmd:something}, out: [object Object]',
    }
  )
})

test('bad-delegate', async (t) => {
  var si = seneca_instance({ log: 'silent' })
  t.after(() => close(si))

  var msgfunc = SenecaMsgTest(si, {
    test: true,
    pattern: 'a:1',
    calls: [
      {
        delegate: 'bad',
        pattern: 'b:1',
      },
    ],
  })()

  await assert.rejects(msgfunc, {
    message: 'Delegate not defined: bad. Message was: {a:1,b:1}',
  })
})

test(
  'dynamic-delegate',
  run_spec(
    seneca_instance({ log: 'silent' }, function (seneca) {
      return seneca
        .use('promisify')
        .message('a:1', async function (msg) {
          return { b: msg.b + 1 }
        })
        .message('c:1', async function (msg) {
          return { b: msg.b }
        })
    }),
    {
      test: true,
      print: false,
      pattern: 'x:1',
      calls: [
        {
          name: 'a',
          pattern: 'a:1',
          params: function () {
            return { b: 2 }
          },
          out: { b: 3 },
          verify: function (call, callmap, spec, seneca) {
            spec.delegates.d0 = seneca.delegate(call.out)
          },
        },
        {
          delegate: 'd0',
          pattern: 'c:1',
          out: { b: 3 },
        },
        {
          delegate: function (call, callmap) {
            return this.delegate(callmap.a.out)
          },
          pattern: 'c:1',
          out: { b: 3 },
        },
      ],
    }
  )
)

test(
  'self-reference',
  run_spec(
    seneca_instance({ log: 'silent' }, function (seneca) {
      return seneca.use(function plugin0() {
        this.add('a:1', function (msg, reply) {
          return reply({ b: msg.b, c: msg.b })
        })
      })
    }),
    {
      test: true,
      allow: { missing: true },
      calls: [
        {
          name: 'self0',
          pattern: 'a:1',
          params: { b: 'b0' },
          out: { b: 'b0', c: '`self0:out.b`' },
        },
      ],
    }
  )
)

test('exports', () => {
  assert.equal(typeof SenecaMsgTest, 'function')
  assert.equal(SenecaMsgTest.MsgTest, SenecaMsgTest)
  assert.equal(typeof SenecaMsgTest.LN, 'function')
  assert.equal(typeof SenecaMsgTest.Joi.object, 'function')
  assert.equal(typeof SenecaMsgTest.intern.run, 'function')
  assert.equal(typeof SenecaMsgTest.intern.missing_messages, 'function')
  assert.equal(typeof SenecaMsgTest.intern.handle_delegate, 'function')

  const err = new Error('foo')
  err.code = 'c0'
  assert.deepEqual(SenecaMsgTest.intern.error_view(err), {
    message: 'foo',
    name: 'Error',
    code: 'c0',
  })
})

function seneca_instance(options, setup) {
  setup = setup || ((x) => x)
  return setup(Seneca(options).use('entity'))
}

// Run the message test, then close the instance so that the process exits.
function run_spec(seneca, spec) {
  const msgtest = SenecaMsgTest(seneca, spec)
  return async function () {
    try {
      await msgtest()
    } finally {
      await close(seneca)
    }
  }
}

function close(seneca) {
  return new Promise((resolve) => seneca.close(resolve))
}
