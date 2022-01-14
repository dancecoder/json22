import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('BigInt values parsing tests', () => {

    test('parsing root level bigint', () => {
        const n = 123n;
        const json = '123n';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level negative bigint', () => {
        const n = -123n;
        const json = '-123n';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing array nested bigint', () => {
        const n = [123n];
        const json = '[123n]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested negative bigint', () => {
        const n = [-123n];
        const json = '[-123n]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing object nested numbers set', () => {
        const n = {
            k1: 123n,
            k2: -123n,
        };
        const json = `{
            "k1": 123n,
            "k2": -123n
        }`;
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('check for positive sign acceptance', () => {
        assert.throws(() => JSON22.parse('+123n'));
    });

    test('check for double sign acceptance', () => {
        assert.throws(() => JSON22.parse('--123n'));
    });

    test('check for decimal point acceptance', () => {
        assert.throws(() => JSON22.parse('12.3n'));
    });


    // special cases

    test('leading zeroes', () => {
        // NOTE: big int parsing is based on BigInt function behavior
        const n = 123n;
        const json = '0123n';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });
});
