# JSON22 - JSON with types
The JSON22 is a superset of [JSON](https://tools.ietf.org/html/rfc7159) with an ability to serialize/deserialize 
classes and extended support for number variables.

## TL;DR
### To there ...
```javascript
const value = {
    name: "Femistoclus",
    amount: 3873133n,
    debt: NaN,
    date: new Date('2022-01-07'),
};
const string = JSON22.stringify(value);
console.log(string);
// =>
// {
//    "name": "Femistoclus"
//    "amount": 3873133n,
//    "debt": NaN,
//    "date": Date(1641513600000),
// }
```

### ... and back
```javascript
const string = `{
  "name": "Femistoclus"
  "amount": 3873133n,
  "debt": NaN,
  "date": Date(1641513600000),
}`;
const value = JSON22.parse(string);
console.log(typeof value.date, value.date.constructor.name); // => object Date
console.log(typeof value.amount); // => bigint
console.log(typeof value.debt, isNaN(value.debt)); // => number true
```
## Motivation
JSON format is good enough for everyday usage. There are some libraries trying to introduce syntax to make JSON closer
to modern JavaScript, some libraries trying to introduce functions serialization. All that is not important and is not
required for everyday usage. However, there is one thing annoying me always - date values. 

We are serializing dates a lot and each time we parse it back we are getting a string. As a result we have to deal with 
the Date constructor manually each time. Even if we are no need date as an object, date formatter will have to make date 
object in order to make user-friendly text representation. Otherwords we are forced to care about dates additionally.
It produces bulky solutions or tons of inline type conversions.

But I'm lazy developer, I'll do everything to get rid of any additional careness.

## API
Note: JSON22 cannot be used as drop in JSON object replacement due to `parse` and `stringify` methods 
arguments incompatibility. But you may not be worried in case you are using first arguments only.
```typescript
class JSON22 {
    static parse(text: string, options?: Json22ParseOptions): any;
    static stringify(value: any, options?: Json22StringifyOptions): string;
}

interface Json22ParseOptions {
    context?: Record<string, { new (...args: any) }>; // default { 'Date': Date }
    // To be extended
}

interface Json22StringifyOptions {
    // To be extended
}
```

## JSON Extensions

### Numbers

With JSON22 you can use `NaN`, `Infinity`, `-Infinity` values. It means also this values will be stringified well 
in case it nested at an array or an object.
```javascript
JSON.stringify([42, NaN, Infinity, -Infinity]); // => [42, null, null, null] 
JSON22.stringify([42, NaN, Infinity, -Infinity]); // => [42, NaN, Infinity, -Infinity]
```
```javascript
JSON.stringify({ nan: NaN }); // => { "nan": null } 
JSON22.stringify({ nan: NaN }); // => { "nan": NaN }
```

### BigInt
JSON22 introduce support for BigInt values
```javascript
JSON.stringify({ bigint: 123n }); // => Uncaught TypeError: Do not know how to serialize a BigInt
JSON22.stringify({ bigint: 123n }); // => { "bigint": 123n } 
JSON22.parse('{ "bigint": 123n }'); // => { bigint: 123n }
```

### Trailing commas
It was not planned, but parser implementation work well with trailing commas. 
There is no sense to complicate the parser code to avoid it. It looks useful.

```javascript
JSON.parse('[1, 2, 3, ]'); // => Uncaught SyntaxError: Unexpected token ] in JSON at position 9
JSON22.parse('[1, 2, 3, ]'); // => [1, 2, 3]
```
```javascript
JSON.parse('{ "a": 1, "b": 2, "c": 3, }'); // => Uncaught SyntaxError: Unexpected token } in JSON at position 26
JSON22.parse('{ "a": 1, "b": 2, "c": 3, }'); // => { a: 1, b:2, c:3 }
```
### Typed values
This is the most significant addition. It's allow you to serialize and deserialize any typed value. 
Out of the box it works well with date values.
```javascript
const date = new Date('2022-01-07');
JSON.stringify(date); // => '"2022-01-07T00:00:00.000Z"'
JSON22.stringify(date); // => Date(1641513600000)
```
```javascript
const date = JSON22.parse('Date(1641513600000)');
console.log(typeof date, date instanceof Date); // => object true 
```
This behavior is based on the `valueOf` method which is defined at the Object class. 
In case JSON22 find the `valueOf` method return a value which is not equal of the object itself then it will produce
constructor literal. The `valueOf` of the Date class return numeric date representation. 
If you'll call the Date constructor with that value then date will be sort of 'restored'.

#### Custom valueOf implementation
To match this behavior you may implement you own `valueOf` method at you custom class.

Let's define a model class for demonstration
```javascript
class TypedModel {
    constructor(data) {
        this.a = data?.a;
        this.b = data?.b;
    }
    valueOf() {
        return { a: this.a, b: this.b };
    }
}
```
That sort of classes will be serialised as typed objects
```javascript
const value = new TypedModel({ a: 1, b: 2 });
JSON22.stringify(value); // => TypedModel({ "a": 1, "b": 1 }) 
```
The `valueOf` methods may return any serializable values, even typed objects
```javascript
const value = new TypedModel({ a: 1, b: new Date('2022-01-07') });
JSON22.stringify(value); // => TypedModel({ "a": 1, "b": Date(1641513600000) }) 
```
#### Parsing context
Typically, serialization and deserialization are processes separated by different environments. 
Like serialization at a backend and deserialization at a frontend and vice versa. 
So `TypedModel` we defined above should be shared between environments. 
Also `JSON22` parser should have a link to this class. In theory, we can push all such classes to a global scope. 
It is easy, however, it is not the best solution. It will produce global scope pollution, may cause naming conflicts,
and it is not safe to allow parser to call any constructor from a global scope. That is why you should always pass
deserialization context to parser.
```javascript
const string = 'TypedModel({ "a": 1, "b": Date(1641513600000) })';
JSON22.parse(string); // => Error: Constructor TypedModel not defined in the context

const context = { 'TypedModel': TypedModel };
const value = JSON22.parse(string, { context });
console.log(value instanceof TypedModel); // => true
```

#### The `valueOf` method priority
The JSON22 support for `toJSON` method of an object as well as JSON. In some cases an object may have both `valueOf` 
and `toJSON` methods. Typical example is the Date class. The JSON22 at first is a solution to serialize/deserialize 
date values, so __`valueOf` have higher priority over `toJSON`__. This is also true for any object implementing `valueOf` 
and `toJSON` both. 
