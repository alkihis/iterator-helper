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

As the proposal purpose, there are a few methods for each prototype. They're presented here with TypeScript types.

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
  toArray(max_count?: number) : T[];
  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initial_value?: V) : V;
  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) : void;

  /* The following methods are bundled, but are not part of the proposal */

  /** End the iterator and return the number of remaining items. */
  count() : number;
  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  join(glue: string) : string;
  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: IterableIterator<I>[]) : HIterator<T | I>;
  /** Iterate through multiple iterators together. */
  zip<O>(...others: IterableIterator<O>[]) : HIterator<(T | O)[]>;
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
}

interface HAsyncIterator<T, TReturn = any, TNext = undefined> {
  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R) : HAsyncIterator<R, TReturn, TNext>;
  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : HAsyncIterator<T, TReturn, TNext>;
  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : HAsyncIterator<T, TReturn, TNext>;
  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HAsyncIterator<T, TReturn, TNext>;
  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HAsyncIterator<[number, T], TReturn, TNext>;
  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R) : HAsyncIterator<R, TReturn, TNext>;
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

  /* The following methods are bundled, but are not part of the proposal */

  /** End the iterator and return the number of remaining items. */
  count() : Promise<number>;
  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  join(glue: string) : Promise<string>;
  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: IterableIterator<I>[]) : HAsyncIterator<T | I>;
  /** Iterate through multiple iterators together. */
  zip<O>(...others: IterableIterator<O>[]) : HAsyncIterator<(T | O)[]>;
  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean) : HAsyncIterator<T>;
  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean) : HAsyncIterator<T>;
  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HAsyncIterator<T>;
  /** Partition {true} elements to first array, {false} elements to second one. */
  partition(callback: (value: T) => boolean) : Promise<[T[], T[]]>;
  /** Find the iterator index of the first element that returns a truthy value, -1 otherwise. */
  findIndex(callback: (value: T) => boolean) : Promise<number>;
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
