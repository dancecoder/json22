import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Literal values parsing tests', () => {

    test('true', () => {
        const l = true;
        const json = 'true';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('false', () => {
        const l = false;
        const json = 'false';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('null', () => {
        const l = null;
        const json = 'null';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('NaN', () => {
        const l = NaN;
        const json = 'NaN';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('Infinity', () => {
        const l = Infinity;
        const json = 'Infinity';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('-Infinity', () => {
        const l = -Infinity;
        const json = '-Infinity';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('parsing space wrapped literal', () => {
        const l = null;
        const json = '\t null\n ';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('parsing object nested literal', () => {
        const l = { k: null };
        const json = '{ "k": null }';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, l);
    });

    test('parsing array nested literal', () => {
        const l = [null];
        const json = '[null]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, l);
    });

    test('check for wrong short literal', () => {
        assert.throws(() => JSON22.parse('dang'));
    });

    test('check for wrong long literal', () => {
        assert.throws(() => JSON22.parse('undetermined'));
    });

    test('check for wrong nested literal', () => {
        assert.throws(() => JSON22.parse('[undetermined]'));
    });
});
