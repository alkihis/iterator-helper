# iterator-polyfill

Provide a polyfill for all methods defined in [iterator helpers proposal](https://github.com/tc39/proposal-iterator-helpers), both for `Iterator` and `AsyncIterator`.

## Installation

Install it with npm/yarn/what you want.

```bash
npm i iterator-polyfill
```

Include it into your JavaScript/TypeScript code.

```js
// With ECMA modules
import 'iterator-polyfill';

// or with CommonJS
require('iterator-polyfill');
```

TypeScript types are bundled within the package as global interfaces, so using the base iterators (array iterators, generators) should not throw type warnings.

## Implementation

The polyfill auto applies to iterators used by arrays, generators and async generators. Usually, you don't need to polyfill them.

For your own objects, you can use `globalThis.Iterator.prototype` and `globalThis.AsyncIterator.prototype`.
Your JS engine must support async generator and `Symbol.asyncIterator` property in order to read the polyfill properly.

```js
const my_it = {
  next() {}
  /** implement throw(), return() */
};

Object.setPrototypeOf(my_it, Iterator.prototype);
```

You can also extends `Iterator` or `AsyncIterator` in your own classes, and implement `.next` in them.

```js
class MyIterator extends Iterator {
  next() {
    return {
      value: 3,
      done: false,
    };
  }
}
```

## Example

Iterator and AsyncIterator are directly bundled into most of needed prototypes.

```js
function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

async function* asyncNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

numbers()
  .map(e => e * 2)
  .take(2)
  .toArray(); // [2, 4] 

asyncNumbers()
  .filter(e => !!(e % 2))
  .map(e => String(e))
  .toArray(); // Promise<["1", "3"]>
```

## API

As the proposal purpose, there are a few methods for each prototype. They're presented here with TypeScript types.

```ts
interface Iterator<T, TReturn = any, TNext = undefined> {
  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R) : Iterator<R, TReturn, TNext>;
  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : Iterator<T, TReturn, TNext>;
  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : Iterator<T, TReturn, TNext>;
  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : Iterator<T, TReturn, TNext>;
  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : Iterator<[number, T], TReturn, TNext>;
  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => Iterator<R> | R) : Iterator<R, TReturn, TNext>;
  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  find(callback: (value: T) => boolean) : T | undefined;
  /** Return `true` if each value of iterator validate {callback}. */
  every(callback: (value: T) => boolean) : boolean;
  /** Return `true` if one value of iterator validate {callback}. */
  some(callback: (value: T) => boolean) : boolean;
  /** Consume iterator and collapse values inside an array. */
  toArray(max_count?: number) : T[];
  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initial_value?: V) : V;
  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) : void;
}

interface AsyncIterator<T, TReturn = any, TNext = undefined> {
  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R) : AsyncIterator<R, TReturn, TNext>;
  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : AsyncIterator<T, TReturn, TNext>;
  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : AsyncIterator<T, TReturn, TNext>;
  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : AsyncIterator<T, TReturn, TNext>;
  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : AsyncIterator<[number, T], TReturn, TNext>;
  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R) : AsyncIterator<R, TReturn, TNext>;
  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  find(callback: (value: T) => boolean) : Promise<T | undefined>;
  /** Return `true` if each value of iterator validate {callback}. */
  every(callback: (value: T) => boolean) : Promise<boolean>;
  /** Return `true` if one value of iterator validate {callback}. */
  some(callback: (value: T) => boolean) : Promise<boolean>;
  /** Consume iterator and collapse values inside an array. */
  toArray(max_count?: number) : Promise<T[]>;
  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initial_value?: V) : Promise<V>;
  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) : Promise<void>;
}
```

A few more methods has been implemented, but they're not part of the specification. See `index.ts` to see them inside the `Iterator` and `AsyncIterator` interface.
