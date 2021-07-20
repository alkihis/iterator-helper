import { HAsyncIterator } from '../async-iterator';
import { IteratorOrIterable, IteratorSlot } from '../types';

export function iter<T, TReturn, TNext>(item: Iterator<T, TReturn, TNext>): HIterator<T, TReturn, TNext>;
export function iter<T>(item: Iterable<T>): HIterator<T>;
export function iter<T, TReturn = any, TNext = undefined>(iterator: Iterator<T, TReturn, TNext> | Iterable<T>): HIterator<T, TReturn, TNext>;
export function iter<T, TReturn = any, TNext = undefined>(item: Iterator<T, TReturn, TNext> | Iterable<T>) {
  return HIterator.from(item);
}

export class HIterator<T, TReturn = any, TNext = undefined> implements Iterator<T, TReturn, TNext> {
  [IteratorSlot]: Iterator<T, TReturn, TNext>;

  constructor(iterator?: Iterator<T, TReturn, TNext>) {
    this[IteratorSlot] = iterator ?? this;
  }

  static from<T, TReturn, TNext>(iterator: Iterator<T, TReturn, TNext>): HIterator<T, TReturn, TNext>;
  static from<T>(iterator: Iterable<T>): HIterator<T>;
  static from<T, TReturn = any, TNext = undefined>(iterator: Iterator<T, TReturn, TNext> | Iterable<T>): HIterator<T, TReturn, TNext>;
  static from<T, TReturn = any, TNext = undefined>(iterator: Iterator<T, TReturn, TNext> | Iterable<T>) {
    if (Symbol.iterator in iterator) {
      return new HIterator((iterator as Iterable<T>)[Symbol.iterator]());
    }
    return new HIterator(iterator as Iterator<T, TReturn, TNext>);
  }

  next(val?: TNext) {
    return this[IteratorSlot].next(val!);
  }

  throw(val?: any) {
    return this[IteratorSlot].throw?.(val) ?? { value: undefined, done: true } as any as IteratorResult<T, TReturn>;
  }

  return(val?: TReturn) {
    return this[IteratorSlot].return?.(val) ?? { value: undefined, done: true } as any as IteratorResult<T, TReturn>;
  }

  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (element: T) => R) : HIterator<R, TReturn, TNext> {
    return new HIterator(HIterator.map.call(this, callback as any)) as HIterator<R, TReturn, TNext>;
  }

  static *map<T, R>(this: Iterator<T>, callback: (element: T) => R) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = callback(value.value);
      const next_value: unknown = yield real_value;
      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.filter.call(this, callback as any)) as HIterator<T, TReturn, TNext>;
  }

  static *filter<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;
      if (callback(real_value)) {
        next_value = yield real_value;
        value = it.next(next_value as any);
      }
      else {
        value = it.next(next_value as any);
      }
    }

    return value.value;
  }

  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  find(callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        return real_value;

      value = it.next();
    }
  }

  /** Return `true` if each value of iterator validate {callback}. */
  every(callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (!callback(real_value))
        return false;

      value = it.next();
    }

    return true;
  }

  /** Return `true` if one value of iterator validate {callback}. */
  some(callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        return true;

      value = it.next();
    }

    return false;
  }

  /** Consume iterator and collapse values inside an array. */
  toArray(max_count = Infinity) {
    const values: T[] = [];

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (max_count <= 0)
        return values;

      values.push(real_value);

      if (max_count !== Infinity)
        max_count--;

      value = it.next();
    }

    return values;
  }

  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : HIterator<T, TReturn, TNext> {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    return new HIterator(HIterator.take.call(this, limit)) as HIterator<T, TReturn, TNext>;
  }

  static *take<T>(this: Iterator<T>, limit: number) {
    const it = this;
    let value = it.next();
    let remaining = limit;
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (remaining <= 0)
        return;

      next_value = yield real_value;
      value = it.next(next_value as any);
      remaining--;
    }

    return value.value;
  }

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HIterator<T, TReturn, TNext> {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    return new HIterator(HIterator.drop.call(this, limit)) as HIterator<T, TReturn, TNext>;
  }

  static *drop<T>(this: Iterator<T>, limit: number) {
    const it = this;
    let value = it.next();
    let remaining = limit;
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (remaining > 0) {
        value = it.next(next_value as any);
        remaining--;
        continue;
      }

      next_value = yield real_value;
      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HIterator<[number, T], TReturn, TNext> {
    return new HIterator(HIterator.asIndexedPairs.call(this)) as HIterator<[number, T], TReturn, TNext>;
  }

  static *asIndexedPairs<T>(this: Iterator<T>) {
    const it = this;
    let value = it.next();
    let index = 0;

    while (!value.done) {
      const real_value = value.value;
      const next_value: unknown = yield [index, real_value];
      value = it.next(next_value as any);
      index++;
    }

    return value.value;
  }

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => IterableIterator<R> | R) : HIterator<R, TReturn, TNext> {
    if (typeof mapper !== 'function') {
      throw new TypeError('Mapper must be a function.');
    }

    return new HIterator(HIterator.flatMap.call(this, mapper as any)) as HIterator<R, TReturn, TNext>;
  }

  static *flatMap<T, R>(this: Iterator<T>, mapper: (value: T) => IterableIterator<R> | R) : Iterator<R> {
    const it = this;
    let value = it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;
      const mapped = mapper(real_value);

      if (Symbol.iterator in mapped) {
        // @ts-ignore
        next_value = yield* mapped[Symbol.iterator]();
      }
      else {
        // @ts-ignore
        next_value = yield mapped;
      }

      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initial_value?: V) {
    let acc = initial_value;

    const it = this;
    if (acc === undefined) {
      acc = it.next().value as any as V;
    }

    let value = it.next();
    while (!value.done) {
      const real_value = value.value;

      acc = reducer(acc!, real_value);

      value = it.next();
    }

    return acc;
  }

  /** Iterate over each value of iterator by calling **callback** for each value. */
  forEach(callback: (value: T) => any) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      callback(real_value);

      value = it.next();
    }
  }

  /** End the iterator and return the number of remaining items. */
  count() {
    let count = 0;

    const it = this;
    let value = it.next();

    while (!value.done) {
      count++;
      value = it.next();
    }

    return count;
  }

  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  join(string: string) {
    let final = '';
    let first = true;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (first) {
        first = false;
        final += real_value;
      }
      else {
        final += string + real_value;
      }

      value = it.next();
    }

    return final;
  }

  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: IteratorOrIterable<I>[]) : HIterator<T | I, TReturn, TNext> {
    return new HIterator(HIterator.chain.apply(this, iterables)) as HIterator<T | I, TReturn, TNext>;
  }

  static *chain<T, I>(this: IterableIterator<T>, ...iterables: IteratorOrIterable<I>[]): Generator<T | I, any, any> {
    yield* this;

    for (const it of iterables) {
      if ('next' in it) {
        yield* it as IterableIterator<I>;
      }
      else {
        // If its not an iterable, make it one
        yield* iter(it);
      }
    }
  }

  /** Iterate through multiple iterators together. */
  zip<O>(...others: IterableIterator<O>[]) : HIterator<(T | O)[], TReturn, TNext> {
    return new HIterator(HIterator.zip.apply(this, others)) as HIterator<(T | O)[], TReturn, TNext>;
  }

  static *zip<T, O>(this: Iterator<T>, ...others: IterableIterator<O>[]) : Iterator<(T | O)[]> {
    const it_array = [this, ...others].map((e: any) => Symbol.iterator in e ? e[Symbol.iterator]() : e as Iterator<T | O>);
    let values = it_array.map(e => e.next());
    let next_value: any;

    while (values.every(e => !e.done)) {
      next_value = yield values.map(e => e.value);
      values = it_array.map(e => e.next(next_value));
    }
  }

  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean) : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.takeWhile.call(this, callback as any)) as HIterator<T, TReturn, TNext>;
  }

  static *takeWhile<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        next_value = yield real_value;
      else
        return;

      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean) : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.dropWhile.call(this, callback as any)) as HIterator<T, TReturn, TNext>;
  }

  static *dropWhile<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value: unknown;
    let finished = false;

    while (!value.done) {
      const real_value = value.value;

      if (!finished && callback(real_value)) {
        value = it.next(next_value as any);
        continue;
      }

      finished = true;
      next_value = yield real_value;

      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.fuse.call(this)) as HIterator<T, TReturn, TNext>;
  }

  static *fuse<T>(this: Iterator<T>) {
    const it = this;
    let value = it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (real_value !== undefined && real_value !== null)
        next_value = yield real_value;
      else
        return;

      value = it.next(next_value as any);
    }

    return value.value;
  }

  /** Partition {true} elements to first array, {false} elements to second one. */
  partition(callback: (value: T) => boolean) {
    const partition1: T[] = [], partition2: T[] = [];

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        partition1.push(real_value);
      else
        partition2.push(real_value);

      value = it.next();
    }

    return [partition1, partition2] as [T[], T[]];
  }

  /** Group by objects by key according to returned key for each object. */
  groupBy<K extends string | number | symbol>(callback: (value: T) => K) {
    const grouped: { [Key in K]: T[] } = {} as any;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const realValue = value.value;
      const key = callback(realValue);

      if (key in grouped) {
        grouped[key].push(realValue);
      }
      else {
        grouped[key] = [realValue];
      }

      value = it.next();
    }

    return grouped;
  }

  /** Index this iterator objects in a {Map} with key obtained through {keyGetter}. */
  toIndexedItems<K>(keyGetter: (value: T) => K) {
    const map = new Map<K, T>();
    const it = this;
    let value = it.next();

    while (!value.done) {
      const realValue = value.value;
      const key = keyGetter(realValue);
      map.set(key, realValue);

      value = it.next();
    }

    return map;
  }

  /** 
   * Iterate over items present in both current collection and {otherItems} iterable. 
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable! 
   */  
  intersection<O>(
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.intersection.call(this, otherItems, isSameItemCallback as any)) as HIterator<T, TReturn, TNext>;
  }

  static *intersection<T, O>(
    this: Iterator<T>, 
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) {
    const otherItemsCollection = iter(otherItems).toArray();
    const it = this;
    let value = it.next();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Yield realValue if any {item} match {realValue} 
      if (otherItemsCollection.some(item => isSameItemCallback(realValue, item))) {
        nextValue = yield realValue;
      }
      
      value = it.next(nextValue as any);
    }

    return value.value;
  }

  /** 
   * Iterate over items present only in current collection, not in {otherItems} iterable. 
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable! 
   */
  difference<O>(
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.difference.call(this, otherItems, isSameItemCallback as any)) as HIterator<T, TReturn, TNext>;
  }

  static *difference<T, O>(
    this: Iterator<T>, 
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) {
    const it = this;
    let value = it.next();
    const otherItemsCollection = iter(otherItems).toArray();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Exclude real_value if any {item} match {realValue}
      if (otherItemsCollection.every(item => !isSameItemCallback(realValue, item))) {
        nextValue = yield realValue;
      }
      
      value = it.next(nextValue as any);
    }

    return value.value;
  }

  /** 
   * Iterate over items present only in current collection or only in {otherItems} iterable, but not in both. 
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable! 
   */
  symmetricDifference<O>(
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) : HIterator<T | O, TReturn, TNext> {
    return new HIterator(HIterator.symmetricDifference.call(this, otherItems, isSameItemCallback as any)) as HIterator<T | O, TReturn, TNext>;
  }

  static *symmetricDifference<T, O>(
    this: Iterator<T>, 
    otherItems: IteratorOrIterable<O>, 
    isSameItemCallback: (value: T, other: O) => boolean = Object.is,
  ) {
    const it = this;
    let value = it.next();
    const otherItemsCollection = iter(otherItems).toArray();
    const presentInBothCollections = new Set<O>();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Try to find same item as current in {other_items_collection}
      const otherItemIndex = otherItemsCollection.findIndex(item => isSameItemCallback(realValue, item));

      if (otherItemIndex !== -1) {
        presentInBothCollections.add(otherItemsCollection[otherItemIndex]);
      }
      else {
        // No match in other collection, can emit it
        nextValue = yield realValue;
      }
      
      value = it.next(nextValue as any);
    }

    for (const item of otherItemsCollection) {
      // Do not emit if {item} is seen in present in both collection items
      if (presentInBothCollections.has(item)) {
        continue;
      }

      yield item;
    }

    return value.value;
  }

  /** Find the iterator index of the first element that returns a truthy value, -1 otherwise. */
  findIndex(callback: (value: T) => boolean) {
    const it = this;
    let i = 0;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        return i;

      value = it.next();
      i++;
    }

    return -1;
  }

  /** Only works if it is a number iterator. Returns the maximum of iterator. */
  max() {
    let max = -Infinity;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = Number(value.value ?? 0);
      if (isNaN(real_value)) {
        throw new RangeError('Iterator should return numbers only, or null or undefined.');
      }

      if (max < real_value)
        max = real_value;

      value = it.next();
    }

    return max;
  }

  /** Only works if it is a number iterator. Returns the minimum of iterator. */
  min() {
    let min = Infinity;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = Number(value.value ?? 0);
      if (isNaN(real_value)) {
        throw new RangeError('Iterator should return numbers only, or null or undefined.');
      }

      if (min > real_value)
        min = real_value;

      value = it.next();
    }

    return min;
  }

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HIterator<T, TReturn, TNext> {
    return new HIterator(HIterator.cycle.call(this)) as HIterator<T, TReturn, TNext>;
  }

  static *cycle<T>(this: Iterator<T>) {
    const values: T[] = [];

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;
      values.push(real_value);

      const next_value: unknown = yield real_value;
      value = it.next(next_value as any);
    }

    while (true) {
      yield* values;
    }
  }

  /** Convert current iterator to a wrapped async iterator. */
  toAsyncIterator() : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HIterator.toAsyncIterator.call(null, this)) as HAsyncIterator<T, TReturn, TNext>;
  }

  /** Convert given iterator to a async generator instance. */
  static async *toAsyncIterator<T, TReturn = any, TNext = undefined>(iterator: IteratorOrIterable<T>): AsyncGenerator<T, TReturn, TNext> {
    const it = iter(iterator);
    let value = it.next();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;
      nextValue = yield Promise.resolve(realValue);
      value = it.next(nextValue as any);
    }

    return value.value;
  }

  [Symbol.iterator]() {
    return this;
  }
}
