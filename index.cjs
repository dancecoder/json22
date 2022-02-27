/*
MIT License

Copyright (c) 2022 Dmitry Dutikov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const HT = '\u0009';  // horizontal tabulation
const SP = '\u0020';  // space
const LF = '\u000A';  // line feed
const CR = '\u000D';  // carriage return
const NEL = '\u0085'; // next line
const LS = '\u2028';  // line separator
const PS = '\u2029';  // paragraph separator

const CRLF = '\u000A\u000D';

const EOL = [ LF, CR, CRLF, NEL, LS, PS ];
const WS = [HT, SP, ...EOL];

const BEGIN_ARRAY = '[';
const BEGIN_OBJECT = '{';
const BEGIN_ARGUMENTS = '(';
const END_ARRAY = ']';
const END_OBJECT = '}';
const END_ARGUMENTS = ')';
const NAME_SEPARATOR  = ':';
const VALUE_SEPARATOR = ',';
const QUOTATION_MARK = '"';
const HEXADECIMALS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','a','b','c','d','e','f'];
const ESCAPE_CHAR = '\\';
const ESCAPE_SHORTENS = [QUOTATION_MARK, ESCAPE_CHAR, '/', 'b', 'f', 'n', 'r', 't'];
const ESCAPE_MAP = {
    [QUOTATION_MARK]: QUOTATION_MARK,
    [ESCAPE_CHAR]: ESCAPE_CHAR,
    '/': '/',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t'
};

const DECIMAL_POINT = '.';
const NUMBER_PLUS = '+';
const NUMBER_MINUS = '-';
const BIGINT_SUFFIX = 'n';
const LITERAL_NULL = 'null';
const LITERAL_TRUE = 'true';
const LITERAL_FALSE = 'false';

const State = {
    value: 'value',
    object: 'object',
    objectMemberKey: 'objectMemberKey',
    objectMemberValue: 'objectMemberValue',
    string: 'string',
    escape: 'escape',
    escapeUnicode: 'escapeUnicode',
    array: 'array',
    arrayItem: 'arrayItem',
    literal: 'literal',
    constructor: 'constructor',
    number: 'number',
    numberFrac: 'numberFrac',
    numberExpSign: 'numberExpSign',
    numberExpValue: 'numberExpValue',
};

class JSON22 {

    static mimeType = 'application/x.json22';

    static #Stack = class {
        #array;
        #crCheck = false;

        /**
         * @param {any[]} [initial=[]]
         * @param {boolean} [checkForCircularReferences = false]
         */
        constructor(initial, checkForCircularReferences = false) {
            this.#array = initial ?? [];
            this.#crCheck = checkForCircularReferences;
        }

        push(value) {
            if (this.#crCheck && typeof value === 'object' && value !== null) {
                for (const elm of this.#array) {
                    if (elm === value) {
                        throw new Error('Circular reference found');
                    }
                }
            }
            this.#array.push(value);
        }

        pop(from) {
            const v = this.#array.pop();
            if (from != null && v !== from) {
                throw new Error(`${v} entry was not closed`);
            }
            return v;
        }

        shift() {
            return this.#array.shift();
        }

        switch(from, to) {
            this.pop(from);
            this.push(to);
        }

        switchTopValue(to) {
            this.#array[this.#array.length - 1] = to;
        }

        get top() {
            return this.#array[this.#array.length - 1];
        }

        get empty() {
            return this.#array.length === 0;
        }
    }

    static #defaultContext = {
        'Date': Date,
    }

    /**
     * @param {string} s
     * @return {Generator<{ c: string, i: number, code: number }, undefined, boolean>}
     * */
    static * #iterate(s) {
        for (let i = 0, max = s.length; i < max; i++) {
            const c = s[i];
            const code = s.charCodeAt(i);
            if (c === CR && s[i+1] === LF) {
                const stepBack = yield { c: CRLF, i, code };
                if (stepBack) {
                    i-= 2;
                } else {
                    i++;
                }
            } else {
                const stepBack = yield { c, i, code };
                if (stepBack) {
                    i-= 2;
                }
            }
        }
    }

    /**
     * @param {string} text
     * @param {{
     *     context?: Record<string, { new (...args: any) }>;
     * }} [options]
     * */
    static parse(text, options) {
        const context = {};
        Object.assign(context, this.#defaultContext);
        Object.assign(context, options?.context ?? {});

        const it = JSON22.#iterate(text);
        let stateStack = new JSON22.#Stack([State.value]);
        let valueStack = new JSON22.#Stack();

        for (const { c, i, code } of it) {
            switch (stateStack.top) {
                case State.value:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case QUOTATION_MARK:
                            valueStack.push([{ start: i, end: i, type: 'string' }]);
                            stateStack.push(State.string);
                            break;
                        case BEGIN_OBJECT:
                            valueStack.push({});
                            stateStack.push(State.object);
                            stateStack.push(State.objectMemberKey);
                            break;
                        case BEGIN_ARRAY:
                            valueStack.push([]);
                            stateStack.push(State.array);
                            stateStack.push(State.value);
                            break;
                        case END_ARRAY:
                            // empty array
                            stateStack.pop(State.value);
                            stateStack.pop(State.array);
                            stateStack.pop(State.value);
                            break;
                        case END_ARGUMENTS:
                            // empty arguments
                            const ctorName = valueStack.pop()[0];
                            const ctor = context[ctorName];
                            if (ctor == null) {
                                throw new Error(`Constructor ${ctorName} not defined in the context`);
                            }
                            valueStack.push(new ctor());
                            stateStack.pop(State.value);
                            stateStack.pop(State.constructor);
                            stateStack.pop(State.value);
                            break;
                        case VALUE_SEPARATOR:
                            const value = valueStack.pop();
                            valueStack.top.push(value);
                            stateStack.pop();
                            break;
                        case '_':
                        case '$':
                        case (code >= 0x41 && code <= 0x5a ? c : undefined): // uppercase ASCII letters
                        case (code >= 0x61 && code <= 0x7a ? c : undefined): // lowercase ASCII letters
                            // leading digits are forbidden
                            valueStack.push([c]);
                            stateStack.push(State.literal);
                            break;
                        case NUMBER_MINUS:
                        case (code >= 0x30 && code <= 0x39 ? c : undefined): // digits0-9
                            valueStack.push([c]);
                            stateStack.push(State.number);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, literal identifier expected`);
                    }
                    break;
                case State.string:
                    switch (c) {
                        case (code < 0x20 ? c : undefined):
                            throw new Error(`Character ${c} at position ${i} is not allowed, try to escape it`);
                        case ESCAPE_CHAR:
                            const region = valueStack.top.pop();
                            valueStack.top.push(text.slice(region.start+1, region.end+1));
                            stateStack.push(State.escape);
                            break;
                        case QUOTATION_MARK:
                            const r = valueStack.top.pop();
                            valueStack.top.push(text.slice(r.start+1, r.end+1));
                            const substrings = valueStack.pop();
                            const value = substrings.join('');
                            valueStack.push(value);
                            stateStack.pop(State.string);
                            stateStack.pop(); // out of value or objectMemberKey
                            break;
                        default:
                            valueStack.top[valueStack.top.length-1].end = i;
                            break;
                    }
                    break;
                case State.escape:
                    switch (c) {
                        case (ESCAPE_SHORTENS.indexOf(c) > -1 ? c : undefined):
                            valueStack.top.push(ESCAPE_MAP[c]);
                            valueStack.top.push({ start: i, end: i, type: 'string' });
                            stateStack.pop();
                            break;
                        case 'u': // unicode escape like \u0020
                            valueStack.top.push({ start: i, end: i, type: 'escapeUnicode' });
                            stateStack.switch(State.escape, State.escapeUnicode);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, escape sequence expected`);
                    }
                    break;
                case State.escapeUnicode:
                    switch(c) {
                        case (HEXADECIMALS.indexOf(c) > -1 ? c : undefined):
                            const region = valueStack.top[valueStack.top.length-1];
                            region.end = i;
                            if (region.end - region.start === 4) {
                                valueStack.top.pop();
                                const codeText = text.slice(region.start+1, region.end+1);
                                const code = parseInt(codeText, 16);
                                valueStack.top.push(String.fromCharCode(code));
                                valueStack.top.push({ start: i, end: i, type: 'string' });
                                stateStack.pop(State.escapeUnicode);
                            }
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, unicode escape sequence expected`);
                    }
                    break;
                case State.object:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case NAME_SEPARATOR:
                            stateStack.push(State.objectMemberValue);
                            stateStack.push(State.value);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, name separator expected`);
                    }
                    break;
                case State.objectMemberKey:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case QUOTATION_MARK:
                            valueStack.push([{ start: i, end: i, type: 'string' }]);
                            stateStack.push(State.string);
                            break;
                        case END_OBJECT:
                            // we got empty object here
                            stateStack.pop(State.objectMemberKey);
                            stateStack.pop(State.object);
                            stateStack.pop(State.value);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, object entry expected, entry key must be in quotation marks`);
                    }
                    break;
                case State.objectMemberValue:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case VALUE_SEPARATOR:
                        case END_OBJECT:
                            const value = valueStack.pop();
                            const key = valueStack.pop();
                            Object.defineProperty(valueStack.top, key, {
                                value,
                                configurable: true,
                                enumerable: true,
                                writable: true,
                            });
                            stateStack.pop(State.objectMemberValue);
                            if (c === END_OBJECT) {
                                stateStack.pop(State.object);
                                stateStack.pop(State.value);
                            } else {
                                stateStack.push(State.objectMemberKey);
                            }
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, value separator or end of object expected`);
                    }
                    break;
                case State.array:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case VALUE_SEPARATOR:
                            const value = valueStack.pop();
                            valueStack.top.push(value);
                            stateStack.push(State.value);
                            break;
                        case END_ARRAY:
                            const lastValue = valueStack.pop();
                            valueStack.top.push(lastValue);
                            stateStack.pop(State.array);
                            stateStack.pop(State.value);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, value separator expected`);
                    }
                    break;
                case State.literal:
                    switch(c) {
                        case '_':
                        case '$':
                        case (code >= 0x30 && code <= 0x39 ? c : undefined): // digits
                        case (code >= 0x41 && code <= 0x5a ? c : undefined): // uppercase ASCII letters
                        case (code >= 0x61 && code <= 0x7a ? c : undefined): // lowercase ASCII letters
                            const top = valueStack.top;
                            top.push(c);
                            if (top.length === 3 && top[0] === 'N' && top[1] === 'a' && top[2] === 'N') {
                                valueStack.switchTopValue(NaN);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            if (top.length === 4 && top[0] === 'n' && top[1] === 'u' && top[2] === 'l' && top[3] === 'l') {
                                valueStack.switchTopValue(null);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            if (top.length === 4 && top[0] === 't' && top[1] === 'r' && top[2] === 'u' && top[3] === 'e') {
                                valueStack.switchTopValue(true);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            if (top.length === 5 && top[0] === 'f' && top[1] === 'a' && top[2] === 'l' && top[3] === 's' && top[4] === 'e') {
                                valueStack.switchTopValue(false);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            if (top.length === 8 && top[0] === 'I' && top[1] === 'n' && top[2] === 'f' && top[3] === 'i' && top[4] === 'n' && top[5] === 'i' && top[6] === 't' && top[7] === 'y') {
                                valueStack.switchTopValue(Infinity);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            if (top.length === 9 && top[0] === '-' && top[1] === 'I' && top[2] === 'n' && top[3] === 'f' && top[4] === 'i' && top[5] === 'n' && top[6] === 'i' && top[7] === 't' && top[8] === 'y') {
                                valueStack.switchTopValue(-Infinity);
                                stateStack.pop(State.literal);
                                stateStack.pop(State.value);
                                break;
                            }
                            break;
                        case BEGIN_ARGUMENTS:
                            stateStack.switch(State.literal, State.constructor);
                            stateStack.push(State.value);
                            const ctorName = valueStack.pop().join('');
                            valueStack.push([ctorName]);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, literal or constructor expected`);
                    }
                    break;
                case State.constructor:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case VALUE_SEPARATOR:
                            const arg = valueStack.pop();
                            valueStack.top.push(arg);
                            stateStack.push(State.value);
                            break;
                        case END_ARGUMENTS:
                            const lastArg = valueStack.pop();
                            valueStack.top.push(lastArg);
                            const def = valueStack.pop();
                            const ctorName = def.shift();
                            const ctor = context[ctorName];
                            if (ctor == null) {
                                throw new Error(`Constructor ${ctorName} not defined in the context`);
                            }
                            valueStack.push(new ctor(...def));
                            stateStack.pop(State.constructor);
                            stateStack.pop(State.value);
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, value separator or end of arguments expected`);
                    }
                    break;
                case State.number:
                    switch (c) {
                        case (code >= 0x30 && code <= 0x39 ? c : undefined): // digits0-9
                            valueStack.top.push(c);
                            break;
                        case DECIMAL_POINT:
                            valueStack.top.push(c);
                            stateStack.switch(State.number, State.numberFrac);
                            break;
                        case 'e':
                        case 'E':
                            valueStack.top.push(c);
                            stateStack.switch(State.number, State.numberExpSign);
                            break;
                        case 'I': // it may be negative Infinity
                            valueStack.top.push(c);
                            stateStack.switch(State.number, State.literal);
                            break;
                        case BIGINT_SUFFIX:
                            const bi = valueStack.pop();
                            valueStack.push(BigInt(bi.join('')));
                            stateStack.pop(State.number);
                            stateStack.pop(State.value);
                            break;
                        default:
                            const n = valueStack.pop();
                            valueStack.push(Number(n.join('')));
                            it.next(true); // move it back
                            stateStack.pop(State.number);
                            stateStack.pop(State.value);
                            break;
                    }
                    break;
                case State.numberFrac:
                    switch (c) {
                        case (code >= 0x31 && code <= 0x39 ? c : undefined): // digits0-9
                            valueStack.top.push(c);
                            break;
                        case 'e':
                        case 'E':
                            valueStack.top.push(c);
                            stateStack.switch(State.numberFrac, State.numberExpSign);
                            break;
                        default:
                            const n = valueStack.pop();
                            valueStack.push(Number(n.join('')));
                            it.next(true); // move it back
                            stateStack.pop(State.numberFrac);
                            stateStack.pop(State.value);
                            break;
                    }
                    break;
                case State.numberExpSign:
                    switch (c) {
                        case (code >= 0x31 && code <= 0x39 ? c : undefined): // digits0-9
                            valueStack.top.push(c);
                            stateStack.switch(State.numberExpSign, State.numberExpValue);
                            break;
                        case NUMBER_PLUS:
                        case NUMBER_MINUS:
                            valueStack.top.push(c);
                            stateStack.switch(State.numberExpSign, State.numberExpValue);
                            break;
                        default:
                            const n = valueStack.pop();
                            const num = Number(n.join(''));
                            if (isNaN(num)) {
                                throw new Error('Incorrect number syntax');
                            }
                            valueStack.push(num);
                            it.next(true); // move it back
                            stateStack.pop(State.numberExpValue);
                            stateStack.pop(State.value);
                            break;
                    }
                    break;
                case State.numberExpValue:
                    switch (c) {
                        case (code >= 0x31 && code <= 0x39 ? c : undefined): // digits0-9
                            valueStack.top.push(c);
                            break;
                        default:
                            const n = valueStack.pop();
                            const num = Number(n.join(''));
                            if (isNaN(num)) {
                                throw new Error(`Unexpected character ${c} at ${i}, exponent value expected`);
                            }
                            valueStack.push(num);
                            it.next(true); // move it back
                            stateStack.pop(State.numberExpValue);
                            stateStack.pop(State.value);
                            break;
                    }
                    break;
                default:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, EOL expected`);
                    }
            }
        }

        if (stateStack.empty) {
            return valueStack.pop();
        }

        switch (stateStack.top) {
            case State.literal:
                const value = valueStack.pop().join('');
                throw new Error(`Unknown literal ${value}`);
            case State.number:
            case State.numberFrac:
            case State.numberExpValue:
                const n = valueStack.pop();
                const num = Number(n.join(''));
                if (isNaN(num)) {
                    throw new Error('Incorrect number syntax');
                }
                return num;
            default:
                throw Error('Syntax error, structure is not finished');
        }

    }

    /**
     * @param {any} value
     * @param {{}} [options]
     * @return {string}
     * */
    static stringify(value, options) {
        const vStack = new JSON22.#Stack([value], true);
        const result = [];
        while (!vStack.empty) {
            const type = typeof vStack.top;
            switch (type) {
                case "function":
                case "undefined":
                case "symbol":
                    vStack.pop();
                    break;
                case "number":
                    result.push(String(vStack.top));
                    vStack.pop();
                    break;
                case "bigint":
                    result.push(String(vStack.top));
                    result.push(BIGINT_SUFFIX);
                    vStack.pop();
                    break;
                case "boolean":
                    result.push(vStack.top ? LITERAL_TRUE : LITERAL_FALSE);
                    vStack.pop();
                    break;
                case "string":
                    result.push(QUOTATION_MARK);
                    result.push(vStack.top);
                    result.push(QUOTATION_MARK);
                    vStack.pop();
                    break;
                case "object":
                    if (vStack.top === null) {
                        result.push(LITERAL_NULL);
                        vStack.pop();
                    } else if (vStack.top.objectEntriesItem) {
                        if (vStack.top.done) {
                            vStack.pop();
                            result.push(VALUE_SEPARATOR);
                            continue;
                        }
                        switch (typeof vStack.top[1]) {
                            case "function":
                            case "symbol":
                            case "undefined":
                                vStack.pop();
                                continue;
                            default:
                                result.push(QUOTATION_MARK);
                                result.push(vStack.top[0]);
                                result.push(QUOTATION_MARK);
                                result.push(NAME_SEPARATOR);
                                vStack.top.done = true;
                                vStack.push(vStack.top[1]);
                                break;
                        }
                    } else if (vStack.top.objectEntries) {
                        if (vStack.top.next === vStack.top.length) {
                            if (result[result.length-1] === VALUE_SEPARATOR) {
                                result.pop();
                            }
                            result.push(END_OBJECT);
                            vStack.pop(); // objectEntries
                            vStack.pop(); // object
                            continue;
                        }
                        const next = vStack.top.next;
                        vStack.top.next++;
                        vStack.top[next].objectEntriesItem = true;
                        vStack.push(vStack.top[next]);
                    } else if (vStack.top.constructorArguments) {
                        if (vStack.top.index > -1) {
                            result.push(VALUE_SEPARATOR);
                        }
                        vStack.top.index++;
                        if (vStack.top.args.length === vStack.top.index) {
                            if (result[result.length-1] === VALUE_SEPARATOR) {
                                result.pop();
                            }
                            result.push(END_ARGUMENTS);
                            vStack.pop(); // constructorArguments
                            vStack.pop(); // object
                        } else {
                            switch (typeof vStack.top.args[vStack.top.index]) {
                                case "function":
                                case "symbol":
                                case "undefined":
                                    throw new Error('Unsupported constructor argument type');
                                default:
                                    vStack.push(vStack.top.args[vStack.top.index]);
                                    break;
                            }
                        }

                    } else if (vStack.top.arrayItem) {
                        if (vStack.top.index > -1) {
                            result.push(VALUE_SEPARATOR);
                        }
                        vStack.top.index++;
                        if (vStack.top.array.length === vStack.top.index) {
                            if (result[result.length-1] === VALUE_SEPARATOR) {
                                result.pop();
                            }
                            result.push(END_ARRAY);
                            vStack.pop(); // arrayItem
                            vStack.pop(); // array

                        } else {
                            switch (typeof vStack.top.array[vStack.top.index]) {
                                case "function":
                                case "symbol":
                                case "undefined":
                                    // NOTE:  RFS8259 say nothing about serialisation of disallowed types nested
                                    //        at an array, so we follow the JSON.stringify behavior here as it make sense
                                    //        to keep length of an array
                                    vStack.push(null);
                                    break;
                                default:
                                    vStack.push(vStack.top.array[vStack.top.index]);
                                    break;
                            }
                        }
                    } else if (Array.isArray(vStack.top)) {
                        result.push(BEGIN_ARRAY);
                        vStack.push({ arrayItem: true, index: -1, array: vStack.top });
                    } else {
                        const objectValue = vStack.top.valueOf()
                        if (objectValue !== vStack.top) {
                            const args = [].concat(objectValue);
                            if (args.length > vStack.top.constructor.length) {
                                throw Error('Arguments lengths  greater then constructor length');
                            }
                            result.push(vStack.top.constructor.name);
                            result.push(BEGIN_ARGUMENTS);
                            vStack.push({ constructorArguments: true, index: -1, args });
                            break;
                        }
                        if (typeof vStack.top.toJSON === 'function') {
                            result.push(vStack.top.toJSON());
                            vStack.pop();
                            break;
                        }
                        result.push(BEGIN_OBJECT);
                        const entries = Object.entries(vStack.top);
                        entries.objectEntries = true;
                        entries.next = 0;
                        vStack.push(entries);
                    }
                    break;
                default:
                    throw new Error(`Unexpected type ${type}`);
            }
        }
        if (result.length === 0) {
            return undefined;
        }
        return result.join('');
    }
}

module.exports = { JSON22 };
