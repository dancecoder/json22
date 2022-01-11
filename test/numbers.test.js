import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

suite('Number values parsing tests', () => {

    test('parsing root level plain number', () => {
        const n = 123;
        const json = '123';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level negative number', () => {
        const n = -123;
        const json = '-123';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with fraction', () => {
        const n = 0.1;
        const json = '0.1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with exponent', () => {
        const n = 1e1;
        const json = '1e1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with signed positive exponent', () => {
        const n = 1e+1;
        const json = '1e+1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with signed negative exponent', () => {
        const n = 1e-1;
        const json = '1e-1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with fraction and exponent', () => {
        const n = 0.1e1;
        const json = '0.1e1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level negative number with fraction and exponent', () => {
        const n = -0.1e1;
        const json = '-0.1e1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level negative number with fraction and signed exponent', () => {
        const n = -0.1e+1;
        const json = '-0.1e+1';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });


    test('parsing array nested plain number', () => {
        const n = [123];
        const json = '[123]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested negative number', () => {
        const n = [-123];
        const json = '[-123]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested number with fraction', () => {
        const n = [0.1];
        const json = '[0.1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested number with exponent', () => {
        const n = [1e1];
        const json = '[1e1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested number with signed positive exponent', () => {
        const n = [1e+1];
        const json = '[1e+1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested number with signed negative exponent', () => {
        const n = [1e-1];
        const json = '[1e-1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested number with fraction and exponent', () => {
        const n = [0.1e1];
        const json = '[0.1e1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested negative number with fraction and exponent', () => {
        const n = [-0.1e1];
        const json = '[-0.1e1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested negative number with fraction and signed exponent', () => {
        const n = [-0.1e+1];
        const json = '[-0.1e+1]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing array nested numbers set', () => {
        const n = [-0.1e+1, -0.1e1, 0.1e1, 1e-1, 1e+1, 1e1, 0.1, -0.1, 123, -123];
        const json = '[-0.1e+1, -0.1e1, 0.1e1, 1e-1, 1e+1, 1e1, 0.1, -0.1, 123, -123]';
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('parsing object nested numbers set', () => {
        const n = {
            k1: -0.1e+1,
            k2: -0.1e1,
            k3: 0.1e1,
            k4: 1e-1,
            k5: 1e+1,
            k6: 1e1,
            k7: 0.1,
            k8: -0.1,
            k9: 123,
            k10: -123
        };
        const json = `{
            "k1": -0.1e+1,
            "k2": -0.1e1,
            "k3": 0.1e1,
            "k4": 1e-1,
            "k5": 1e+1,
            "k6": 1e1,
            "k7": 0.1,
            "k8": -0.1,
            "k9": 123,
            "k10": -123
        }`;
        const parsed = JSON22.parse(json);
        assert.deepEqual(parsed, n);
    });

    test('check for positive sign acceptance', () => {
        assert.throws(() => JSON22.parse('+1'));
    });

    test('check for double sign acceptance', () => {
        assert.throws(() => JSON22.parse('--1'));
    });

    test('check for missed exponent', () => {
        assert.throws(() => JSON22.parse('1e'));
    });

    test('check for missed exponent for nested case', () => {
        assert.throws(() => JSON22.parse('[1e]'));
    });

    test('check for missed signed exponent', () => {
        assert.throws(() => JSON22.parse('1e+'));
    });

    test('check for missed signed exponent for nested case', () => {
        assert.throws(() => JSON22.parse('[1e+]'));
    });

    test('check for missed int part', () => {
        assert.throws(() => JSON22.parse('.1'));
    });

    test('check for missed int part for nested case', () => {
        assert.throws(() => JSON22.parse('[.1]'));
    });

    // Special cases

    test('parsing root level number with missed fraction part', () => {
        // this behavior based on the Number function as we use it for numbers parsing
        const n = 1;
        const json = '1.';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

    test('parsing root level number with leading zero', () => {
        // this behavior based on the Number function as we use it for numbers parsing
        // fo the future: hex numbers like 0x10 may be parsed by the Number the same way
        const n = 1;
        const json = '01';
        const parsed = JSON22.parse(json);
        assert.equal(parsed, n);
    });

});
