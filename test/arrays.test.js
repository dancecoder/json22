import { JSSO } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Array values parsing tests', () => {

    test('parsing root level empty array value', () => {
        const a = [];
        const json = '[]';
        const parsed = JSSO.parse(json);
        assert.deepEqual(parsed, a);
    });

    test('parsing array with single string value', () => {
        const a = ['v1'];
        const json = '["v1"]';
        const parsed = JSSO.parse(json);
        assert.deepEqual(parsed, a);
    });

    test('parsing array with few string values', () => {
        const a = ['v1', 'v2', 'v3'];
        const json = '[ "v1", "v2", "v3" ]';
        const parsed = JSSO.parse(json);
        assert.deepEqual(parsed, a);
    });

    test('parsing array heterogeneous values', () => {
        const a = ['v1', { v: '2' }];
        const json = '[ "v1", { "v": "2" } ]';
        const parsed = JSSO.parse(json);
        assert.deepEqual(parsed, a);
    });

    test('parsing array with finishing value separator', () => {
        const a = ['v1', 'v2', ];
        const json = '[ "v1", "v2", ]';
        const parsed = JSSO.parse(json);
        assert.deepEqual(parsed, a);
    });

    // TODO: add negative tests

});
