import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Object values parsing tests', () => {

    test('parsing root level empty object value', () => {
        const o = {};
        const json = '{}';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with single string entry', () => {
        const o = { k: 'v' };
        const json = '{"k":"v"}';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with few string entries', () => {
        const o = { k1: 'v1', k2: 'v2' };
        const json = '{ "k1": "v1", "k2": "v2" }';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with an object entry', () => {
        const o = { k: { v: "1" } };
        const json = '{ "k": { "v": "1" } }';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with an array entry', () => {
        const o = { k: ['v'] };
        const json = '{ "k": ["v"] }';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with finishing value separator', () => {
        const o = { k: { v: "1" } };
        const json = '{ "k": { "v": "1", }, }';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('parsing object with escaped chars in a key', () => {
        const o = {"\u0000":1234,"\u0001":"abcd","\u0002":true,"\u0003":null,"last":false};
        const json = '{"\\u0000":1234,"\\u0001":"abcd","\\u0002":true,"\\u0003":null,"last":false}';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, o);
    });

    test('check for incorrect char after entry value', () => {
        assert.throws(() => JSON22.parse('{ "k": "v" Z }'));
    });

    test('check for incorrect object entry start', () => {
        assert.throws(() => JSON22.parse('{ k: "v" }'));
    });

    test('check for missed object entry name separator', () => {
        assert.throws(() => JSON22.parse('{ "k" }'));
    });

});
