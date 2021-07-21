# iterator-helper

Provide helpers that polyfill all methods defined in [iterator helpers proposal](https://github.com/tc39/proposal-iterator-helpers), both for `Iterator` and `AsyncIterator`, and even more.

## Installation

Install it with npm/yarn/what you want.

```bash
npm i iterator-helper
```

## Getting started

You can wrap an iterable or an iterator with the exported `iter` (for standard iterables) and `aiter` (for async iterables) functions.

```js
import { iter, aiter } from 'iterator-helper';

// It accepts both iterables and iterator, here it's an iterable
const iterator = iter([1, 2, 3]);

const mapped_cycle = iterator
  .cycle() // Make the iterator cycle on end
  .map(e => e * 2) // For each item, execute e => e * 2
  .asIndexedPairs(); // For each item, return [iterator_index, item]

for (const [index, element] of mapped_cycle) {
  console.log(index, element);
  // 0, 2
  // 1, 4
  // 2, 6
  // 3, 2
  // 4, 4
  // 5, 6
  // ...
}
```

You can also extend two exported classes, `HIterator` and `HAsyncIterator` (those names are used to avoid conflicts with possible futures `Iterator` and `AsyncIterator` global objects), in order to make your classes iterables.

```js
import { HIterator } from 'iterator-helper';

class RangeIterator extends HIterator {
  constructor(start, stop = undefined, step = 1) {
    super();
    this.position = stop === undefined ? 0 : start;
    this.stop = stop === undefined ? start : stop;
    this.step = step;

    if (stop < start) {
      throw new Error('Stop cannot be inferior to start.');
    }
    if (step <= 0) {
      throw new Error('Step must be superior to 0.');
    }
  }

  next() {
    if (this.position < this.stop) {
      const current = this.position;
      this.position += this.step;

      return { value: current, done: false };
    }

    return { value: undefined, done: true };
  }
}

const range = new RangeIterator(10).filter(e => e % 2 === 0);
range.next(); // { value: 0, done: false };
range.next(); // { value: 2, done: false };
range.next(); // { value: 4, done: false };
// ...
```

## API

There are a few methods for each sync or async iterators.
Here's the quick way, as TypeScript types with a description for each method:

```ts
interface HIterator<T, TReturn = any, TNext = undefined> {
  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R) : HIterator<R, TReturn, TNext>;

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : HIterator<T, TReturn, TNext>;

  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : HIterator<T, TReturn, TNext>;

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HIterator<T, TReturn, TNext>;

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HIterator<[number, T], TReturn, TNext>;

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => Iterator<R> | R) : HIterator<R, TReturn, TNext>;

  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  find(callback: (value: T) => boolean) : T | undefined;

  /** Return `true` if each value of iterator validate {callback}. */
  every(callback: (value: T) => boolean) : boolean;

  /** Return `true` if one value of iterator validate {callback}. */
  some(callback: (value: T) => boolean) : boolean;

  /** Consume iterator and collapse values inside an array. */
  toArray(maxCount?: number) : T[];

  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initialValue?: V) : V;

  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) : void;

  /** End the iterator and return the number of remaining items. */
  count() : number;

  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  join(glue: string) : string;

  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: IteratorOrIterable<I>[]) : HIterator<T | I>;

  /** Iterate through multiple iterators together. */
  zip<O>(...others: IteratorOrIterable<O>[]) : HIterator<(T | O)[]>;

  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean) : HIterator<T>;

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean) : HIterator<T>;

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HIterator<T>;

  /** Partition {true} elements to first array, {false} elements to second one. */
  partition(callback: (value: T) => boolean) : [T[], T[]];

  /** Find the iterator index of the first element that returns a truthy value, -1 otherwise. */
  findIndex(callback: (value: T) => boolean) : number;

  /** Only works if it is a number iterator. Returns the maximum of iterator. */
  max() : number;

  /** Only works if it is a number iterator. Returns the minimum of iterator. */
  min() : number;

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HIterator<T>;

  /** Group by objects by key according to returned key for each object. */
  groupBy<K extends string | number | symbol>(callback: (value: T) => K) : { [Key in K]: T[] };

  /** Index this iterator objects in a {Map} with key obtained through {keyGetter}. */
  toIndexedItems<K>(keyGetter: (value: T) => K) : Map<K, T>;

  /** Iterate over items present in both current collection and {otherItems} iterable. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  intersection<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>;

  /** Iterate over items present only in current collection, not in {otherItems} iterable. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  difference<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>;

  /** Iterate over items present only in current collection or only in {otherItems} iterable, but not in both. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  symmetricDifference<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>;

  /** Transform current sync iterator to an async one (wrap each new item into a resolved `Promise`) */
  toAsyncIterator(): HAsyncIterator<T>;
}

interface HAsyncIterator<T, TReturn = any, TNext = undefined> {
  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R | PromiseLike<R>) : HAsyncIterator<R, TReturn, TNext>;

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T, TReturn, TNext>;

  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : HAsyncIterator<T, TReturn, TNext>;

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HAsyncIterator<T, TReturn, TNext>;

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HAsyncIterator<[number, T], TReturn, TNext>;

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R) : HAsyncIterator<R, TReturn, TNext>;

  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  find(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<T | undefined>;

  /** Return `true` if each value of iterator validate {callback}. */
  every(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<boolean>;

  /** Return `true` if one value of iterator validate {callback}. */
  some(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<boolean>;

  /** Consume iterator and collapse values inside an array. */
  toArray(maxCount?: number) : Promise<T[]>;

  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V | PromiseLike<V>, initialValue?: V) : Promise<V>;

  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) : Promise<void>;

  /** End the iterator and return the number of remaining items. */
  count() : Promise<number>;

  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  join(glue: string) : Promise<string>;

  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: AsyncIteratorOrIterable<I>[]) : HAsyncIterator<T | I>;

  /** Iterate through multiple iterators together. */
  zip<O>(...others: AsyncIteratorOrIterable<O>[]) : HAsyncIterator<(T | O)[]>;

  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T>;

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T>;

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HAsyncIterator<T>;

  /** Partition {true} elements to first array, {false} elements to second one. */
  partition(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<[T[], T[]]>;

  /** Find the iterator index of the first element that returns a truthy value, -1 otherwise. */
  findIndex(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<number>;

  /** Only works if it. is a number iterator. Returns the maximum of iterator. */
  max() : Promise<number>;

  /** Only works if it. is a number iterator. Returns the minimum of iterator. */
  min() : Promise<number>;

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HAsyncIterator<T>;

  /** Group by objects by key according to returned key for each object. */
  groupBy<K extends string | number | symbol>(callback: (value: T) => K | PromiseLike<K>) : Promise<{ [Key in K]: T[] }>;

  /** Index this iterator objects in a {Map} with key obtained through {keyGetter}. */
  toIndexedItems<K>(keyGetter: (value: T) => K | PromiseLike<K>) : Promise<Map<K, T>>;

  /** Iterate over items present in both current collection and {otherItems} iterable. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  intersection<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is
  ) : HAsyncIterator<T>;

  /** Iterate over items present only in current collection, not in {otherItems} iterable. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  difference<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is
  ) : HAsyncIterator<T>;

  /** Iterate over items present only in current collection or only in {otherItems} iterable, but not in both. `O(n*m)` operation that will consume {otherItems} iterator/iterable! */
  symmetricDifference<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is
  ) : HAsyncIterator<T>;
}
```

## Helpers

`iter` function expose some iterator creator helpers:

- `range`
- `repeat`

There's presented as TypeScript types.

```ts
// iter is instance of IIterFunction
interface IIterFunction {
  /** Create a new range `HIterator` from {0} to {stop}, 1 by 1. If {stop} is negative, it goes -1 by -1. */
  range(stop: number): HIterator<number>;
  /** Create a new range `HIterator` from {start} to {stop}, 1 by 1. If {stop} < {start}, it goes -1 by -1. */
  range(start: number, stop: number): HIterator<number>;
  /** Create a new range `HIterator` from {start} to {stop}, adding {step} at each step. */
  range(start: number, stop: number, step: number): HIterator<number>;

  /** Create a new `HIterator` that emit only {item} indefinitively. */
  repeat<I>(item: I): HIterator<I>;
  /** Create a new `HIterator` that emit only {item}, {times} times. */
  repeat<I>(item: I, times: number): HIterator<I>;
}
```

### Examples

```ts
for (const i of iter.range(10)) {
  // i will goes from 0 to 9 (included)
}

for (const _ of iter.repeat(null, 10)) {
  // This loop content will be executed 10 times
}

iter.repeat({ id: 1, name: 'Sialae' }) // Create an infinite iterator that yield { id: 1, name: 'Sialae' }
  .asIndexedPairs() // Yield [index, element]
  .map(([index, item]) => ({ ...item, id: index + 1 })) // For [index, element], returns { ...element, id: index + 1 }
  .filter(item => item.id % 2 !== 0) // Yield only elements with element.id % 2 !== 0
  .take(3) // Yield 3 items maximum then close the iterator
  .toArray(); // Store the remaining iterator items into an array (3 elements)
// Result: [{ name: 'Sialae', id: 1 }, { name: 'Sialae', id: 3 }, { name: 'Sialae', id: 5 }]
```

## Descriptive API

Here's is every supported method, with a small example associated.

### Sync iterators

Sync iterators uses the `HIterator` class/instances.

#### `iter` (module function)

Create the iterator wrapper `HIterator` from an `Iterable` (Array, Set, Map...) or an `Iterator` (`Generator` instance, user-land iterator, ...).

```ts
import { iter } from 'iterator-helper'

// From an iterable
iter([1, 2, 3]) // => HIterator<1 | 2 | 3>

// From an iterator
iter([1, 2, 3].entries()) // => HIterator<[number, 1 | 2 | 3]>
```

#### `.from` (static method)

Do the same as `iter` function call. `HIterator.from([1, 2, 3])` produces the same result as `iter([1, 2, 3])`.

#### `.map<R>(callback: (value: T) => R) : HIterator<R, TReturn, TNext>`

Transform each item of iterator to another value through the result of `callback(item)`.
```ts
iter([1, 2, 3])
  .map(item => item * 2)
  .toArray() // [2, 4, 6]
```

#### `.filter(callback: (value: T) => boolean) : HIterator<T, TReturn, TNext>`

Do not yield item of iterator if `callback(item)` is falsy.
```ts
iter([1, 2, 3])
  .filter(item => item % 2 !== 0)
  .toArray() // [1, 3]
```

#### `.take(limit: number) : HIterator<T, TReturn, TNext>`

Create a new iterator that consume `limit` items, then stops.
```ts
iter([1, 2, 3])
  .take(2)
  .toArray() // [1, 2]
```

#### `.drop(limit: number) : HIterator<T, TReturn, TNext>`

Create a new iterator that ignore `limit` items from being yielded, then continue the iterator as it used to be.
```ts
iter([1, 2, 3])
  .drop(2)
  .toArray() // [3]
```

#### `.asIndexedPairs() : HIterator<[number, T], TReturn, TNext>`

Get a pair `[index, value]` for each value of an iterator.
```ts
iter([1, 2, 3])
  .asIndexedPairs()
  .toArray() // [[0, 1], [1, 2], [2, 3]]
```

#### `.flatMap<R>(mapper: (value: T) => Iterator<R> | R) : HIterator<R, TReturn, TNext>`

Like map, but you can return a new iterator that will be flattened.
```ts
iter([1, 2, 3])
  .flatMap(item => iter.range(item))
  .toArray() // [0, 0, 1, 0, 1, 2]
```

#### `.find(callback: (value: T) => boolean) : T | undefined`

Find a specific item that returns `true` in `callback(item)`, and return it. Returns `undefined` otherwise.
```ts
iter([1, 2, 3]).find(item => item % 2 === 0) // 2
iter([1, 2, 3]).find(item => item % 2 === 4) // undefined
```

#### `.findIndex(callback: (value: T) => boolean) : number`

Find a specific item that returns `true` in `callback(item)`, and return its index. Returns `-1` otherwise.
```ts
iter([1, 2, 3]).findIndex(item => item % 2 === 0) // 1
iter([1, 2, 3]).findIndex(item => item % 2 === 4) // -1
```

#### `.every(callback: (value: T) => boolean) : boolean`

Return `true` if each item of iterator validate `callback(item)`.
```ts
iter([1, 2, 3]).every(item => item > 0) // true
```

#### `.some(callback: (value: T) => boolean) : boolean`

Return `true` if at least one item of iterator validate `callback(item)`.
```ts
iter([1, 2, 3]).every(item => item > 2) // true
```

#### `.toArray(maxCount?: number) : T[]`

Consume iterator (up to `maxCount` items, default to infinity) and collapse values inside an array.
```ts
iter([1, 2, 3]).toArray() // [1, 2, 3]
```

#### `.reduce<V>(reducer: (acc: V, value: T) => V, initialValue?: V) : V`

Accumulate each item inside `acc` for each value `value`.
```ts
iter([1, 2, 3]).reduce((acc, value) => acc + value) // 6
```

#### `.forEach(callback: (value: T) => any) : void`

Iterate over each value of iterator by calling `callback` for each item.
```ts
iter([1, 2, 3]).forEach(console.log.bind(console)) // Logs 1, then 2, then 3
```

#### `.count() : number`

End the iterator and return the number of counted items.
```ts
iter([1, 2, 3]).count() // 3
```

#### `.join(glue: string) : string`

Join all the remaining elements of the iterator in a single glue string `glue`.
```ts
iter([1, 2, 3]).join(', ') // '1, 2, 3'
```

#### `.chain<I>(...iterables: IteratorOrIterable<I>[]) : HIterator<T | I>`

Iterate through current iterator, then through the given iterators in the correct order.
```ts
iter([1, 2, 3])
  .chain([4, 5, 6])
  .toArray() // [1, 2, 3, 4, 5, 6]
```

#### `.zip<O>(...others: IteratorOrIterable<O>[]) : HIterator<(T | O)[]>`

Iterate through multiple iterators together.
```ts
iter([1, 2, 3])
  .zip([4, 5, 6])
  .toArray() // [[1, 4], [2, 5], [3, 6]]
```

#### `.takeWhile(callback: (value: T) => boolean) : HIterator<T>`

Continue iterator until `callback` return a falsy value.
```ts
iter([1, 2, 3])
  .takeWhile(item => item / 2 > 1)
  .toArray() // [1, 2]
```

#### `.dropWhile(callback: (value: T) => boolean) : HIterator<T>`

Skip elements until `callback` return a truthy value.
```ts
iter([1, 2, 3])
  .dropWhile(item => item / 2 <= 1)
  .toArray() // [3]
```

#### `.fuse() : HIterator<T>`

Continue iterator until `null` or `undefined` is encountered.
```ts
iter([1, 2, 3, undefined])
  .fuse()
  .toArray() // [1, 2, 3]
```

#### `.partition(callback: (value: T) => boolean) : [T[], T[]]`

Partition `true` elements to first array, `false` elements to second one.
```ts
iter([1, 2, 3]).partition(item => item % 2 === 0) // [[2], [1, 3]]
```

#### `.max() : number`

Only works if it is a number iterator. Returns the maximum of iterator.
```ts
iter([1, 2, 3]).max() // 3
```

#### `.min() : number`

Only works if it is a number iterator. Returns the minimum of iterator.
```ts
iter([1, 2, 3]).min() // 1
```

#### `.cycle() : HIterator<T>`

When iterator ends, go back to the first item then loop. Indefinitively.
```ts
iter([1, 2, 3])
  .cycle()
  .take(6)
  .toArray() // [1, 2, 3, 1, 2, 3]
```

#### `.groupBy<K extends string | number | symbol>(callback: (value: T) => K) : { [Key in K]: T[] }`

Group by objects by key according to returned key for each object.
```ts
iter([1, 2, 3]).groupBy(item => item % 2 === 0 ? 'even' : 'odd') // { even: [2], odd: [1, 3] }
```

#### `.toIndexedItems<K>(keyGetter: (value: T) => K) : Map<K, T>`

Index this iterator objects in a `Map` with key obtained through `keyGetter`.
```ts
iter([1, 2, 3]).toIndexedItems(item => `key-${item}`) // Map<{ 'key-1': 1, 'key-2': 2, 'key-3': 3 }>
```

#### `.intersection<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>`

Iterate over items present in both current collection and `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
iter([1, 2, 3])
  .intersection([3, 4, 5]) // equivalent to .intersection([3, 4, 5], (a, b) => Object.is(a, b))
  .toArray() // [3]
```

#### `.difference<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>`

Iterate over items present only in current collection, not in `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
iter([1, 2, 3])
  .difference([3, 4, 5]) // equivalent to .difference([3, 4, 5], (a, b) => Object.is(a, b))
  .toArray() // [1, 2]
```

#### `.symmetricDifference<O>(otherItems: IteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean = Object.is) : HIterator<T>`

Iterate over items present only in current collection or only in `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
iter([1, 2, 3])
  .symmetricDifference([3, 4, 5]) // equivalent to .symmetricDifference([3, 4, 5], (a, b) => Object.is(a, b))
  .toArray() // [1, 2, 4, 5]
```

#### `.toAsyncIterator(): HAsyncIterator<T>`

Transform current sync iterator to an async one (wrap each new item into a resolved `Promise`).
See below for available `HAsyncIterator` methods.

```ts
iter([1, 2, 3]).toAsyncIterator() // HAsyncIterator<1 | 2 | 3>
```

### Async iterators

Async iterators uses the `HAsyncIterator` class/instances.

> **Notice**: The following async generator will be used in all async examples:
```ts
async function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}
```

> **Notice**: In most of the cases, when a method takes a callback, the return value can be either a value **or a `Promise`**. If its a `Promise`, it will be awaited.

#### `aiter` (module function)

Create the iterator wrapper `HAsyncIterator` from an `AsyncIterable` (objects with `Symbol.asyncIterator` defined) or an `AsyncIterator` (`AsyncGenerator` instance, user-land async iterator, ...).

```ts
import { aiter } from 'iterator-helper'

// From an async iterable
aiter({ 
  async *[Symbol.asyncIterator]() {
    yield* numbers();
  } 
}) // => HAsyncIterator<1 | 2 | 3>

// From an iterator
aiter(numbers()) // => HAsyncIterator<1 | 2 | 3>
```

#### `.from` (static method)

Do the same as `aiter` function call. `HAsyncIterator.from(numbers())` produces the same result as `aiter(numbers())`.

#### `.map<R>(callback: (value: T) => R | PromiseLike<R>) : HAsyncIterator<R, TReturn, TNext>`

Transform each item of iterator to another value through the result of `callback(item)`.
```ts
aiter(numbers())
  .map(item => item * 2)
  .toArray() // Promise<[2, 4, 6]>
```

#### `.filter(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T, TReturn, TNext>`

Do not yield item of iterator if `callback(item)` is falsy.
```ts
aiter(numbers())
  .filter(item => item % 2 !== 0)
  .toArray() // Promise<[1, 3]>
```

#### `.take(limit: number) : HAsyncIterator<T, TReturn, TNext>`

Create a new iterator that consume `limit` items, then stops.
```ts
aiter(numbers())
  .take(2)
  .toArray() // Promise<[1, 2]>
```

#### `.drop(limit: number) : HAsyncIterator<T, TReturn, TNext>`

Create a new iterator that ignore `limit` items from being yielded, then continue the iterator as it used to be.
```ts
aiter(numbers())
  .drop(2)
  .toArray() // Promise<[3]>
```

#### `.asIndexedPairs() : HAsyncIterator<[number, T], TReturn, TNext>`

Get a pair `[index, value]` for each value of an iterator.
```ts
aiter(numbers())
  .asIndexedPairs()
  .toArray() // Promise<[[0, 1], [1, 2], [2, 3]]>
```

#### `.flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R) : HAsyncIterator<R, TReturn, TNext>`

Like map, but you can return a new iterator that will be flattened.
```ts
aiter(numbers())
  .flatMap(item => iter.range(item).toAsyncIterator())
  .toArray() // Promise<[0, 0, 1, 0, 1, 2]>
```

#### `.find(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<T | undefined>`

Find a specific item that returns `true` in `callback(item)`, and return it. Returns `undefined` otherwise.
```ts
aiter(numbers()).find(item => item % 2 === 0) // Promise<2>
aiter(numbers()).find(item => item % 2 === 4) // Promise<undefined>
```

#### `.findIndex(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<number>`

Find a specific item that returns `true` in `callback(item)`, and return its index. Returns `-1` otherwise.
```ts
aiter(numbers()).findIndex(item => item % 2 === 0) // Promise<1>
aiter(numbers()).findIndex(item => item % 2 === 4) // Promise<-1>
```

#### `.every(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<boolean>`

Return `true` if each item of iterator validate `callback(item)`.
```ts
aiter(numbers()).every(item => item > 0) // Promise<true>
```

#### `.some(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<boolean>`

Return `true` if at least one item of iterator validate `callback(item)`.
```ts
aiter(numbers()).every(item => item > 2) // Promise<true>
```

#### `.toArray(maxCount?: number) : Promise<T[]>`

Consume iterator (up to `maxCount` items, default to infinity) and collapse values inside an array.
```ts
aiter(numbers()).toArray() // Promise<[1, 2, 3]>
```

#### `.reduce<V>(reducer: (acc: V, value: T) => V | PromiseLike<V>, initialValue?: V) : Promise<V>`

Accumulate each item inside `acc` for each value `value`.
```ts
aiter(numbers()).reduce((acc, value) => acc + value) // Promise<6>
```

#### `.forEach(callback: (value: T) => any) : Promise<void>`

Iterate over each value of iterator by calling `callback` for each item.
```ts
aiter(numbers()).forEach(console.log.bind(console)) // Logs 1, then 2, then 3
```

#### `.count() : Promise<number>`

End the iterator and return the number of counted items.
```ts
aiter(numbers()).count() // Promise<3>
```

#### `.join(glue: string) : Promise<string>`

Join all the remaining elements of the iterator in a single glue string `glue`.
```ts
aiter(numbers()).join(', ') // Promise<'1, 2, 3'>
```

#### `.chain<I>(...iterables: AsyncIteratorOrIterable<I>[]) : HAsyncIterator<T | I>`

Iterate through current iterator, then through the given iterators in the correct order.
```ts
aiter(numbers())
  .chain(iter([4, 5, 6]).toAsyncIterator())
  .toArray() // Promise<[1, 2, 3, 4, 5, 6]>
```

#### `.zip<O>(...others: AsyncIteratorOrIterable<O>[]) : HAsyncIterator<(T | O)[]>`

Iterate through multiple iterators together.
```ts
aiter(numbers())
  .zip(iter([4, 5, 6]).toAsyncIterator()])
  .toArray() // Promise<[[1, 4], [2, 5], [3, 6]]>
```

#### `.takeWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T>`

Continue iterator until `callback` return a falsy value.
```ts
aiter(numbers())
  .takeWhile(item => item / 2 > 1)
  .toArray() // Promise<[1, 2]>
```

#### `.dropWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T>`

Skip elements until `callback` return a truthy value.
```ts
aiter(numbers())
  .dropWhile(item => item / 2 <= 1)
  .toArray() // Promise<[3]>
```

#### `.fuse() : HAsyncIterator<T>`

Continue iterator until `null` or `undefined` is encountered.
```ts
iter([1, 2, 3, undefined])
  .toAsyncIterator()
  .fuse()
  .toArray() // Promise<[1, 2, 3]>
```

#### `.partition(callback: (value: T) => boolean | PromiseLike<boolean>) : Promise<[T[], T[]]>`

Partition `true` elements to first array, `false` elements to second one.
```ts
aiter(numbers()).partition(item => item % 2 === 0) // Promise<[[2], [1, 3]]>
```

#### `.max() : Promise<number>`

Only works if it is a number iterator. Returns the maximum of iterator.
```ts
aiter(numbers())).max() // Promise<3>
```

#### `.min() : Promise<number>`

Only works if it is a number iterator. Returns the minimum of iterator.
```ts
aiter(numbers()).min() // Promise<1>
```

#### `.cycle() : HAsyncIterator<T>`

When iterator ends, go back to the first item then loop. Indefinitively.
```ts
aiter(numbers())
  .cycle()
  .take(6)
  .toArray() // Promise<[1, 2, 3, 1, 2, 3]>
```

#### `.groupBy<K extends string | number | symbol>(callback: (value: T) => K | PromiseLike<K>) : Promise<{ [Key in K]: T[] }>`

Group by objects by key according to returned key for each object.
```ts
aiter(numbers())
  .groupBy(item => item % 2 === 0 ? 'even' : 'odd') // Promise<{ even: [2], odd: [1, 3] }>
```

#### `.toIndexedItems<K>(keyGetter: (value: T) => K | PromiseLike<K>) : Promise<Map<K, T>>`

Index this iterator objects in a `Map` with key obtained through `keyGetter`.
```ts
aiter(numbers())
  .toIndexedItems(item => `key-${item}`) // Promise<Map<{ 'key-1': 1, 'key-2': 2, 'key-3': 3 }>>
```

#### `.intersection<O>(otherItems: AsyncIteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is) : HAsyncIterator<T>`

Iterate over items present in both current collection and `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
aiter(numbers())
  .intersection(iter([3, 4, 5]).toAsyncIterator())
  .toArray() // Promise<[3]>
```

#### `.difference<O>(otherItems: AsyncIteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is) : HAsyncIterator<T>`

Iterate over items present only in current collection, not in `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
aiter(numbers())
  .difference(iter([3, 4, 5]).toAsyncIterator())
  .toArray() // Promise<[1, 2]>
```

#### `.symmetricDifference<O>(otherItems: AsyncIteratorOrIterable<O>, isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is) : HAsyncIterator<T>`

Iterate over items present only in current collection or only in `otherItems` iterable. `O(n*m)` operation that will consume `otherItems` iterator/iterable!
```ts
aiter(numbers())
  .symmetricDifference(iter([3, 4, 5]).toAsyncIterator()) 
  .toArray() // Promise<[1, 2, 4, 5]>
```


### Iterator creators

#### `iter.range`

Create a range iterator (`HIterator` instance) from:
- 0 to `stop` if only `stop` is specified, from (-)1 by (-)1.
- `start` to `stop`, from (-)1 by (-)1 or from `step` to `step`

```ts
for (const i of iter.range(10)) {
  // i goes from 0 to 9 included, 1 by 1.
}

for (const i of iter.range(0, 10, 2)) {
  // i takes 0, 2, 4, 6, 8 as value
}

for (const i of iter.range(1, 10)) {
  // i goes from 1 to 9 included, 1 by 1.
}

for (const i of iter.range(-10)) {
  // i goes from 0 to -9 included, -1 by -1.
}

for (const i of iter.range(20, 10)) {
  // i goes from 20 to 11 included, -1 by -1.
}
```

#### `iter.repeat`

Create an finite or infinite iterator that constantly yield the same thing.

```ts
iter.repeat({ id: 1 }) // Will yield { id: 1 } indefinitively
// or
iter.repeat({ id: 1 }, 5) // Will yield { id: 1 } 5 times, then stops
``` 
this is equal to this code:
```ts
iter([{ id: 1 }]).cycle()
// or
iter([{ id: 1 }]).cycle().take(5)
```
