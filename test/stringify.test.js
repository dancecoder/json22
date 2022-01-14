import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Stringify method tests', function () {

    test('allowed types', () => {
        const values = ['string', true, false, null, 42, 42n, NaN, Infinity, -Infinity];
        const jsons = ['"string"', 'true', 'false', 'null', '42', '42n', 'NaN', 'Infinity', '-Infinity'];
        for (let i = 0, max = values.length; i < max; i++) {
            const string = JSON22.stringify(values[i]);
            assert.equal(string, jsons[i]);
        }
    });

    test('disallowed types', () => {
        const values = [function () {}, async function () {}, () => {}, async () => {}, Symbol(), undefined];
        for (let i = 0, max = values.length; i < max; i++) {
            const string = JSON22.stringify(values[i]);
            assert.equal(string, undefined);
        }
    });

    test('empty object', () => {
        const js = {};
        const json = '{}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('object - one entry', () => {
        const js = { key: 'value' };
        const json = '{"key":"value"}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('object - many entry', () => {
        // NOTE: this test may fails due to object entries should not be ordered,
        // so both '{"key1":"value1","key2":"value2"}' and '{"key2":"value2","key1":"value1"}' are valid
        const js = { key1: 'value1', key2: 'value2' };
        const json = '{"key1":"value1","key2":"value2"}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('object - allowed type values', () => {
        const values = ['string', true, false, null, 42, 42n];
        const jsons = ['"string"', 'true', 'false', 'null', '42', '42n'];
        for (let i = 0, max = values.length; i < max; i++) {
            const js = { key: values[i] };
            const json = `{"key":${jsons[i]}}`;
            const string = JSON22.stringify(js);
            assert.equal(string, json);
        }
    });

    test('object - disallowed type values', () => {
        const values = [Symbol(), function () {}, undefined];
        for (let i = 0, max = values.length; i < max; i++) {
            const js = { key: values[i] };
            const json = `{}`;
            const string = JSON22.stringify(js);
            assert.equal(string, json);
        }
    });

    test('object - allowed and disallowed type values', () => {
        const js = { key1: 42, key2: Symbol() };
        const json = '{"key1":42}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('object - disallowed and allowed type values', () => {
        const js = { key1: Symbol(), key2: 42 };
        const json = '{"key2":42}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('object - object and array entry', () => {
        const js = { key: { value: [42] } };
        const json = '{"key":{"value":[42]}}';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });


    test('empty array', () => {
        const js = [];
        const json = '[]';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('array - one item', () => {
        const js = ['string'];
        const json = '["string"]';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('array - many items', () => {
        const js = ['string1','string2'];
        const json = '["string1","string2"]';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

    test('array - allowed type items', () => {
        const values = ['string', true, false, null, 42, 42n];
        const jsons = ['"string"', 'true', 'false', 'null', '42', '42n'];
        for (let i = 0, max = values.length; i < max; i++) {
            const js = [values[i]];
            const json = `[${jsons[i]}]`;
            const string = JSON22.stringify(js);
            assert.equal(string, json);
        }
    });

    test('array - disallowed type items', () => {
        const values = [Symbol(), function () {}, undefined];
        for (let i = 0, max = values.length; i < max; i++) {
            const js = [values[i]];
            const json = '[null]';
            const string = JSON22.stringify(js);
            assert.equal(string, json);
        }
    });

    test('array - object and array items', () => {
        const js = [{ key: 'value'}, ['string2']];
        const json = '[{"key":"value"},["string2"]]';
        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });


    test('complex value', () => {
        const js = {
            s: 's', n: 42, b: 42n, t: true, f: false, nn: null, fn: () => {}, sm: Symbol(), un: undefined,
            ar: ['s', 42, undefined, 42n, true, false, null, () => {}, Symbol()],
            ob: {
                s: 's', n: 42, b: 42n, t: true, f: false, nn: null, fn: () => {}, sm: Symbol(), un: undefined,
                ar: ['s', 42, undefined, 42n, true, false, null, () => {}, Symbol()],
                ob: {
                    s: 's', n: 42, b: 42n, t: true, f: false, nn: null, fn: () => {}, sm: Symbol(), un: undefined,
                    ar: ['s', 42, undefined, 42n, true, false, null, () => {}, Symbol()],
                }
            }
        };
        const json = '{'+
            '"s":"s","n":42,"b":42n,"t":true,"f":false,"nn":null,' +
            '"ar":["s",42,null,42n,true,false,null,null,null],' +
            '"ob":{'+
                '"s":"s","n":42,"b":42n,"t":true,"f":false,"nn":null,' +
                '"ar":["s",42,null,42n,true,false,null,null,null],' +
                '"ob":{' +
                    '"s":"s","n":42,"b":42n,"t":true,"f":false,"nn":null,' +
                    '"ar":["s",42,null,42n,true,false,null,null,null]' +
                '}'+
            '}' +
        '}';

        const string = JSON22.stringify(js);
        assert.equal(string, json);
    });

});
