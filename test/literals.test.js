import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Literal values parsing tests', () => {

    test('parsing root level true literal', () => {
        const l = true;
        const json = 'true';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('parsing root level false literal', () => {
        const l = false;
        const json = 'false';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, l);
    });

    test('parsing root level null literal', () => {
        const l = null;
        const json = 'null';
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
