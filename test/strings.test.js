import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('String values parsing tests', () => {

    test('parsing root level string value', () => {
        const s = 'plain text';
        const json = '"plain text"';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, s);
    });

    test('parsing short char escape sequences', () => {
        const s = 'key:\tvalue';
        const json = '"key:\\tvalue"';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, s);
    });

    test('parsing escape only string', () => {
        const s = '\t\t\t\t\t';
        const json = '"\\t\\t\\t\\t\\t"';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, s);
    });

    test('parsing unicode escape sequences', () => {
        const s = 'key:\u0030value';
        const json = '"key:\\u0030value"';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, s);
    });

    test('parsing unicode escape only string', () => {
        const s = '\u0030\u0030\u0030\u0030\u0030';
        const json = '"\\u0030\\u0030\\u0030\\u0030\\u0030"';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, s);
    });

    test('check for unsupported characters', () => {
        // NOTE: characters with code < 0x20 are not allowed (be JSON spec)
        const json = '"\u0019 not allowed"';
        assert.throws(() => JSON22.parse(json));
    });

    test('check for incorrect unicode escape sequence', () => {
        assert.throws(() => JSON22.parse('"\\u00Z9 not valid unicode escape sequence"'));
    });

    test('check for incorrect escape sequence', () => {
        assert.throws(() => JSON22.parse('"\\0 not valid escape sequence"'));
    });

});
