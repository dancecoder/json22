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
const HEXADECIMALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'a', 'b', 'c', 'd', 'e', 'f'];
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

const State = {
    value: 'value',
    object: 'object',
    objectMemberKey: 'objectMemberKey',
    objectMemberValue: 'objectMemberValue',
    string: 'string',
    escape: 'escape',
    array: 'array',
    arrayItem: 'arrayItem',
    literal: 'literal',
    constructor: 'constructor',
    number: 'number',
    numberFrac: 'numberFrac',
    numberExpSign: 'numberExpSign',
    numberExpValue: 'numberExpValue',
};

export class JSSO {

    static #Stack = class {
        #array;

        /**
         * @param {any[]} [initial=[]]
         */
        constructor(initial) {
            this.#array = initial ?? [];
        }

        push(value) {
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
     * @param {Record<string, { new (...args: any) }>} [context]
     * */
    static parse(text, context= JSSO.#defaultContext) {
        const it = JSSO.#iterate(text);
        let stateStack = new JSSO.#Stack([State.value]);
        let valueStack = new JSSO.#Stack();

        for (const { c, i, code } of it) {
            switch (stateStack.top) {
                case State.value:
                    switch (c) {
                        case (WS.indexOf(c) > -1 ? c : undefined):
                            // ignore
                            break;
                        case QUOTATION_MARK:
                            valueStack.push([]);
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
                            stateStack.push(State.escape);
                            break;
                        case QUOTATION_MARK:
                            const chars = valueStack.pop();
                            const value = chars.join('');
                            valueStack.push(value);
                            stateStack.pop(State.string);
                            stateStack.pop(); // out of value or objectMemberKey
                            break;
                        default:
                            valueStack.top.push(c);
                            break;
                    }
                    break;
                case State.escape:
                    switch (c) {
                        case (ESCAPE_SHORTENS.indexOf(c) > -1 ? c : undefined):
                            valueStack.top.push(ESCAPE_MAP[c]);
                            stateStack.pop();
                            break;
                        case 'u': // unicode escape like \u0020
                            valueStack.push(['unicode']);
                            break;
                        case (HEXADECIMALS.indexOf(c) > -1 ? c : undefined):
                            if (valueStack.top[0] === 'unicode') {
                                if (valueStack.top.length === 5) {
                                    const top = valueStack.pop();
                                    top.shift();
                                    const code = parseInt(top.join(''), 16);
                                    valueStack.top.push(String.fromCharCode(code));
                                    stateStack.pop();
                                }
                            } else {
                                throw new Error(`Unexpected character ${c} at ${i}, unicode escape sequence expected`);
                            }
                            break;
                        default:
                            throw new Error(`Unexpected character ${c} at ${i}, escape sequence expected`);
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
                            valueStack.push([]);
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

    static stringify(value) {
        const vStack = new JSSO.#Stack([value]);
        const result = [];
        while (!vStack.empty) {
            const type = typeof vStack.top;
            switch (type) {
                case "function":
                    break;
                case "bigint":
                    break;
                case "boolean":
                    break;
                case "string":
                    break;
                case "number":
                    break;
                case "undefined":
                    break;
                case "symbol":
                    break;
                case "object":
                    break;
                default:
                    throw new Error(`Unexpected type ${type}`);
            }
        }
    }
}
