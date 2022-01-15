import { JSON22 } from '../index.js';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';

const context = {
    'EmptyArgument': function() { this.empty = true },
    'SingleArgument': function(a) { this.single = true; this.a = a; },
    'DoubleArgument': function(a, b) { this.double = true; this.a = a; this.b = b },
};

suite('Constructor values parsing tests', () => {

    test('parsing root level empty argument constructor value', () => {
        const c = new context.EmptyArgument();
        const json = 'EmptyArgument()';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing single argument constructor value', () => {
        const c = new context.SingleArgument('v1');
        const json = 'SingleArgument("v1")';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing double argument constructor value', () => {
        const c = new context.DoubleArgument('v1', 'v2');
        const json = 'DoubleArgument("v1", "v2")';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing single argument constructor nested in array', () => {
        const c = [new context.SingleArgument('v1')];
        const json = '[SingleArgument("v1")]';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing single argument constructor nested in object', () => {
        const c = { k: new context.SingleArgument('v1') };
        const json = '{ "k": SingleArgument("v1") }';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing true literal as argument', () => {
        const c = new context.SingleArgument(true);
        const json = 'SingleArgument(true)';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing false literal as argument', () => {
        const c = new context.SingleArgument(false);
        const json = 'SingleArgument(false)';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing null literal as argument', () => {
        const c = new context.SingleArgument(null);
        const json = 'SingleArgument(null)';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing number as argument', () => {
        const c = new context.SingleArgument(0.1);
        const json = 'SingleArgument(0.1)';
        const parsed = JSON22.parse(json, { context });
        assert.deepEqual(parsed, c);
    });

    test('parsing without context', () => {
        assert.throws(() => JSON22.parse('EmptyArgument()'));
    });

    test('check for wrong constructor', () => {
        assert.throws(() => JSON22.parse('[SingleArgument("1"]'));
    });

    test('check for wrong constructor 2', () => {
        assert.throws(() => JSON22.parse('[SingleArgument(]'));
    });

    test('check for wrong first char in name', () => {
        assert.throws(() => JSON22.parse('0SingleArgument()'));
    });

});
