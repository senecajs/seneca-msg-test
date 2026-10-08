/* Copyright (c) 2018-2026 Voxgig and other contributors, MIT License */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_util_1 = __importDefault(require("node:util"));
const node_assert_1 = __importDefault(require("node:assert"));
const seneca_1 = __importDefault(require("seneca"));
const Jsonic = require('jsonic');
const Inks = require('inks');
const Optioner = require('optioner');
const Joi = Optioner.Joi;
const optioner = Optioner({
    init: Joi.function(),
    test: Joi.boolean().default(true),
    log: Joi.boolean().default(false),
    data: Joi.object().unknown().default({}),
    context: Joi.object().unknown().default({}),
    fix: Joi.string().default(''), // DEPRECATED, use pattern instead
    pattern: Joi.string().default(''),
    delegates: Joi.object()
        .pattern(/^/, Joi.array().items(Joi.object().allow(null)))
        .default({}),
    allow: Joi.object({
        missing: Joi.boolean().default(false),
    }).default(),
    calls: Joi.alternatives().try(Joi.function(), Joi.array().items(Joi.object({
        name: Joi.string().min(1),
        print: Joi.boolean().default(false),
        print_context: Joi.boolean().default(false),
        pattern: Joi.string().min(3),
        params: Joi.alternatives()
            .try(Joi.object().unknown(), Joi.func())
            .default({}),
        out: Joi.alternatives()
            .try(Joi.object().unknown(), Joi.array())
            .allow(null),
        err: Joi.object().unknown(),
        delegate: Joi.alternatives(Joi.string(), Joi.array(), Joi.func()),
        verify: Joi.func(),
        run: Joi.boolean(),
        line: Joi.string(),
    }))),
});
function msg_test(seneca, spec) {
    // Seneca instance is optional
    if (seneca && !seneca.seneca) {
        spec = seneca;
        seneca = null;
    }
    spec = optioner.check(spec);
    (0, node_assert_1.default)('object' === typeof spec.delegates);
    if (null == seneca) {
        seneca = (0, seneca_1.default)().test();
    }
    if (spec.init) {
        seneca = spec.init(seneca);
    }
    // top level `pattern` replaces `fix`; `fix` deprecated as does not override
    spec.pattern = '' === spec.pattern ? spec.fix : spec.pattern;
    // The fixed arguments of each named delegate. Every run builds its
    // delegates from these into a new `spec.delegates`, so that the test
    // function can run more than once.
    const delegate_defs = spec.delegates;
    test.run = intern.run;
    return test;
    async function test() {
        await intern.ready(seneca);
        if (spec.test) {
            seneca.test(null, spec.log ? 'print' : null);
        }
        // Seneca 4 provides `post` (promise based messages) in core.
        // Seneca 3 needs the seneca-promisify plugin for it.
        if ('function' !== typeof seneca.post) {
            seneca.use('promisify');
            await intern.ready(seneca);
        }
        var datajson = JSON.stringify(spec.data);
        await seneca.post('role:mem-store,cmd:import', {
            merge: true,
            json: datajson,
            default$: {},
        });
        let calls = Array.isArray(spec.calls) ? spec.calls : spec.calls(LN);
        intern.missing_messages(seneca, spec, calls);
        spec.delegates = {};
        Object.keys(delegate_defs).forEach((dk) => {
            spec.delegates[dk] = seneca.delegate.apply(seneca, delegate_defs[dk]);
        });
        await intern.run(seneca, spec, calls);
    }
}
const intern = {
    // Wait until the instance has finished loading plugins and pending
    // work. Uses the callback form of `ready`: on seneca@4.0.0-rc5 the
    // promise form (`await seneca.ready()`) never resolves when the
    // instance is already idle, which is the usual case for test
    // instances created at file load time.
    ready: function (seneca) {
        return new Promise((resolve) => seneca.ready(() => resolve()));
    },
    // Plain object view of an error, for matching against `call.err`.
    // Optioner clones its input, which drops the non-enumerable `message`
    // of an Error, so `message` and `name` are copied explicitly, along
    // with the enumerable properties: on Seneca 3 the wrapper's `code`,
    // `msg`, `orig` and `details`; on Seneca 4 (which passes the action's
    // own error through) whatever the action set on it.
    error_view: function (err) {
        const view = Object.assign({}, err);
        view.message = err.message;
        view.name = err.name;
        // Seneca 3 wraps the action's error: the original is `err.orig`.
        if (err.orig instanceof Error) {
            view.orig = intern.error_view(err.orig);
        }
        return view;
    },
    // Location of the call in the spec file, when recorded by `LN`.
    where: function (call) {
        return call.line ? ' (' + call.line + ')' : '';
    },
    run: async function (seneca, spec, calls) {
        let callmap = spec.context;
        return new Promise((resolve, reject) => {
            next_call(0, function (err) {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve();
                }
            });
        });
        function next_call(call_index, done) {
            try {
                if (calls.length <= call_index) {
                    return done();
                }
                var call = calls[call_index];
                if (false === call.run) {
                    return setImmediate(next_call.bind(null, call_index + 1, done));
                }
                var params = {};
                if ('function' === typeof call.params) {
                    params = call.params(call, callmap, spec, seneca);
                }
                else {
                    params = Inks(call.params, callmap);
                }
                var print = spec.print || call.print;
                if (print) {
                    console.log('\n\nCALL   : ', call.pattern, params);
                }
                if (call.print_context) {
                    console.dir(callmap, { depth: 3, colors: true });
                }
                var msg = Object.assign({}, params, spec.pattern ? Jsonic(spec.pattern) : {}, Jsonic(call.pattern));
                var msgstr = Jsonic.stringify(msg);
                call.msgstr = msgstr;
                let errname = (null == call.name ? '' : call.name + '~') + msgstr + intern.where(call);
                var instance = intern.handle_delegate(seneca, call, callmap, spec);
                instance.act(msg, function (err, out, meta) {
                    // initial call meta data - allows self-refs in validation
                    if (call.name) {
                        callmap[call.name] = {
                            top_pattern: spec.pattern,
                            pattern: call.pattern,
                            params: params,
                            msg: msg,
                            err: err,
                            out: out,
                            meta: meta,
                        };
                    }
                    if (print) {
                        console.log('ERROR  : ', err);
                        console.log('RESULT : ', node_util_1.default.inspect(out, { depth: null, colors: true }));
                    }
                    if (null == call.err) {
                        if (null != err) {
                            return done(new Error('Error not expected for: ' + errname + ', err: ' + err));
                        }
                    }
                    else {
                        if (null == err) {
                            return done(new Error('Error expected for: ' + errname + ', was null'));
                        }
                        var result = Optioner(call.err, { must_match_literals: true })(intern.error_view(err));
                        if (result.error) {
                            return done(new Error('Error for: ' +
                                errname +
                                ' was invalid: ' +
                                result.error.message));
                        }
                    }
                    if (null === call.out) {
                        if (null != out) {
                            return done(new Error('Output not expected for: ' + errname + ', out: ' + out));
                        }
                    }
                    else if (null != call.out) {
                        if (null == out) {
                            return done(new Error('Output expected for: ' + errname + ', was null'));
                        }
                        else {
                            var current_call_out = Inks(call.out, callmap, {
                                exclude: (k, v) => Joi.isSchema(v, { legacy: true }),
                            });
                            result = Optioner(current_call_out, {
                                must_match_literals: true,
                            })(out);
                            if (result.error) {
                                return done(new Error('Output for: ' +
                                    errname +
                                    ' was invalid: ' +
                                    result.error.message));
                            }
                        }
                    }
                    if (null != call.verify) {
                        call.result = { msg, err, out, meta };
                        // TODO: handle Joi validation result
                        result = call.verify(call, callmap, spec, instance);
                        if (null != result && true !== result) {
                            return done(new Error('Verify of: ' +
                                errname +
                                ' failed: ' +
                                (result.message || result)));
                        }
                    }
                    if (call.name) {
                        callmap[call.name] = {
                            top_pattern: spec.pattern,
                            pattern: call.pattern,
                            params: params,
                            msg: msg,
                            err: err,
                            out: out,
                            meta: meta,
                        };
                    }
                    setImmediate(next_call.bind(null, call_index + 1, done));
                });
            }
            catch (e) {
                return done(e);
            }
        }
    },
    // TODO: support a default delegate
    handle_delegate: function (instance, call, callmap, spec) {
        if (call.delegate) {
            if ('string' === typeof call.delegate) {
                instance = spec.delegates[call.delegate];
                if (null == instance) {
                    throw new Error('Delegate not defined: ' +
                        call.delegate +
                        '. Message was: ' +
                        call.msgstr +
                        intern.where(call));
                }
            }
            else if (Array.isArray(call.delegate)) {
                return instance.delegate.apply(instance, call.delegate);
            }
            else if ('function' === typeof call.delegate) {
                return call.delegate.call(instance, call, callmap, spec);
            }
            else {
                throw new Error('Unknown delegate reference: ' +
                    node_util_1.default.inspect(call.delegate) +
                    '. Message was: ' +
                    call.msgstr +
                    intern.where(call));
            }
        }
        return instance;
    },
    missing_messages: function (seneca, spec, calls) {
        var foundmsgs = seneca
            .list(spec.pattern)
            .map((msg) => seneca.util.pattern(msg));
        const specmsgs = [];
        calls.forEach((call) => {
            var specmsg_obj = Jsonic(spec.pattern + ',' + call.pattern);
            specmsgs.push(specmsg_obj);
        });
        // remove msgs once found
        specmsgs.forEach((msg) => {
            var found = seneca.find(msg);
            if (found) {
                foundmsgs = foundmsgs.filter((msg) => msg != found.pattern);
            }
        });
        // there should be none left - all should be found
        if (0 < foundmsgs.length && !spec.allow.missing) {
            throw new Error('Test calls not defined for: ' + foundmsgs.join('; '));
        }
    },
};
// Get line number of test message in spec file.
// Use as an extra value in msg: `+LN()`
function LN(t) {
    var line = new Error().stack
        .split('\n')[2]
        .match(/[\/\\]([^./\\]+)[^/\\]*\.js:(\d+):/)
        .filter((_x, i) => i == 1 || i == 2)
        .join('~');
    if (null == t) {
        return ',LN:' + line;
    }
    else {
        t.line = line;
        return t;
    }
}
msg_test.MsgTest = msg_test;
msg_test.Joi = Joi;
msg_test.LN = LN;
msg_test.intern = intern;
exports.default = msg_test;
if ('undefined' !== typeof module) {
    module.exports = msg_test;
}
//# sourceMappingURL=msg-test.js.map