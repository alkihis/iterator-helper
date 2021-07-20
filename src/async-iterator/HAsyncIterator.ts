import { AsyncIteratorOrIterable, IteratorSlot } from '../types';

export class HAsyncIterator<T, TReturn = any, TNext = undefined> implements AsyncIterator<T, TReturn, TNext> {
  [IteratorSlot]: AsyncIterator<T, TReturn, TNext>;

  constructor(iterator?: AsyncIterator<T, TReturn, TNext>) {
    this[IteratorSlot] = iterator ?? this;
  }

  static from<T, TReturn, TNext>(iterator: AsyncIterator<T, TReturn, TNext>): HAsyncIterator<T, TReturn, TNext>;
  static from<T>(iterator: AsyncIterable<T>): HAsyncIterator<T>;
  static from<T, TReturn = any, TNext = undefined>(iterator: AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>): HAsyncIterator<T, TReturn, TNext>;
  static from<T, TReturn = any, TNext = undefined>(item: AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>) {
    if (Symbol.asyncIterator in item) {
      return new HAsyncIterator((item as AsyncIterable<T>)[Symbol.asyncIterator]());
    }
    return new HAsyncIterator(item as AsyncIterator<T, TReturn, TNext>);
  }

  next(val?: TNext) {
    return this[IteratorSlot].next(val!);
  }

  throw(val?: any) {
    return this[IteratorSlot].throw?.(val) ?? Promise.resolve({ value: undefined, done: true }) as any as Promise<IteratorResult<T, TReturn>>;
  }

  return(val?: TReturn) {
    return this[IteratorSlot].return?.(val) ?? Promise.resolve({ value: undefined, done: true }) as any as Promise<IteratorResult<T, TReturn>>;
  }

  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R | PromiseLike<R>) : HAsyncIterator<R, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.map.call(this, callback as any)) as HAsyncIterator<R, TReturn, TNext>;
  }

  static async *map<T, R>(this: AsyncIterator<T>, callback: (value: T) => R | PromiseLike<R>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = await callback(value.value);
      const next_value: unknown = yield real_value;
      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.filter.call(this, callback as any)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *filter<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value)) {
        next_value = yield real_value;
      }

      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Find a specific value that returns `true` in {callback}, and return it. Returns `undefined` otherwise. */
  async find(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value))
        return real_value;

      value = await it.next();
    }
  }

  /** Return `true` if each value of iterator validate {callback}. */
  async every(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (!await callback(real_value))
        return false;

      value = await it.next();
    }

    return true;
  }

  /** Return `true` if one value of iterator validate {callback}. */
  async some(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value))
        return true;

      value = await it.next();
    }

    return false;
  }

  /** Consume iterator and collapse values inside an array. */
  async toArray(max_count = Infinity) {
    const values: T[] = [];

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (max_count <= 0)
        return values;

      values.push(real_value);

      if (max_count !== Infinity)
        max_count--;

      value = await it.next();
    }

    return values;
  }

  /** Create a new iterator that consume {limit} items, then stops. */
  take(limit: number) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.take.call(this, limit)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *take<T>(this: AsyncIterator<T>, limit: number) {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    const it = this;
    let value = await it.next();
    let next_value: unknown;
    let remaining = limit;

    while (!value.done) {
      if (remaining <= 0)
        return;

      const real_value = value.value;

      next_value = yield real_value;
      value = await it.next(next_value as any);
      remaining--;
    }

    return value.value;
  }

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.drop.call(this, limit)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *drop<T>(this: AsyncIterator<T>, limit: number) {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    const it = this;
    let value = await it.next();
    let next_value: unknown;
    let remaining = limit;

    while (!value.done) {
      if (remaining > 0) {
        remaining--;
        value = await it.next(next_value as any);
        continue;
      }

      const real_value = value.value;

      next_value = yield real_value;
      value = await it.next(next_value as any);
      remaining--;
    }

    return value.value;
  }

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HAsyncIterator<[number, T], TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.asIndexedPairs.call(this)) as HAsyncIterator<[number, T], TReturn, TNext>;
  }

  static async *asIndexedPairs<T>(this: AsyncIterator<T>) {
    let index = 0;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;
      const next_value: unknown = yield [index, real_value];
      index++
      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R | PromiseLike<AsyncIterator<R>> | PromiseLike<R>) : HAsyncIterator<R, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.flatMap.call(this, mapper as any)) as HAsyncIterator<R, TReturn, TNext>;
  }

  static async *flatMap<T, R>(this: AsyncIterator<T>, mapper: (value: T) => AsyncIterator<R> | R | PromiseLike<AsyncIterator<R>> | PromiseLike<R>) {
    if (typeof mapper !== 'function') {
      throw new TypeError('Mapper must be a function.');
    }

    const it = this;
    let value = await it.next();
    let next_value: any;

    while (!value.done) {
      const real_value = value.value;
      const mapped = await mapper(real_value);

      if (Symbol.asyncIterator in mapped) {
        // @ts-ignore
        yield* mapped[Symbol.asyncIterator]();
      }
      else if (Symbol.iterator in mapped) {
        // @ts-ignore
        yield* mapped[Symbol.iterator]();
      }
      else {
        yield mapped;
      }

      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Accumulate each item inside **acc** for each value **value**. */
  async reduce<V>(reducer: (acc: V, value: T) => V | PromiseLike<V>, initial_value?: V) {
    let acc = initial_value;

    const it = this;
    if (acc === undefined) {
      acc = (await it.next()).value as any as V;
    }

    for await (const value of it) {
      acc = await reducer(acc!, value);
    }

    return acc;
  }

  /** Iterate over each value of iterator by calling **callback** for each value. */
  async forEach(callback: (value: T) => any | PromiseLike<any>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      await callback(real_value);

      value = await it.next();
    }
  }

  /** Join all the remaining elements of the iterator in a single string with glue {glue}. */
  async join(string: string) {
    let final = '';
    let first = true;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (first) {
        first = false;
        final += real_value;
      }
      else {
        final += string + real_value;
      }

      value = await it.next();
    }

    return final;
  }

  /** End the iterator and return the number of remaining items. */
  async count() {
    let count = 0;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      count++;

      value = await it.next();
    }

    return count;
  }

  /** Iterate through current iterator, then through the given iterators in the correct order. */
  chain<I>(...iterables: AsyncIteratorOrIterable<I>[]) : HAsyncIterator<T | I, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.chain.call(this, ...iterables)) as HAsyncIterator<T | I, TReturn, TNext>;
  }

  static async *chain<T, I>(this: AsyncIterableIterator<T>, ...iterables: AsyncIteratorOrIterable<I>[]): AsyncGenerator<T | I, any, any> {
    yield* this;

    for (const it of iterables) {
      if ('next' in it) {
        yield* it as AsyncIterableIterator<I>;
      }
      else {
        // If its not an iterable, make it one
        yield* HAsyncIterator.from(it);
      }
    }
  }

  /** Iterate through multiple iterators together. */
  zip<O>(other: AsyncIteratorOrIterable<O>) : HAsyncIterator<[T, O][], TReturn, TNext>;
  zip<O>(...others: AsyncIteratorOrIterable<O>[]) : HAsyncIterator<(T | O)[], TReturn, TNext>;
  zip<O>(...others: AsyncIteratorOrIterable<O>[]) : HAsyncIterator<(T | O)[], TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.zip.call(this, ...others)) as HAsyncIterator<(T | O)[], TReturn, TNext>;
  }

  static async *zip<T, O>(this: AsyncIteratorOrIterable<T>, ...others: AsyncIteratorOrIterable<O>[]) : AsyncIterator<(T | O)[]> {
    const it_array = [this, ...others]
      .map((e: AsyncIteratorOrIterable<T | O>) =>
        Symbol.asyncIterator in e
          ? (e as AsyncIterable<T | O>)[Symbol.asyncIterator]()
          : e as AsyncIterator<T | O>
      );
    let values = await Promise.all(it_array.map(e => e.next()));

    while (values.every(e => !e.done)) {
      yield values.map(e => e.value);
      values = await Promise.all(it_array.map(e => e.next()));
    }
  }

  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.takeWhile.call(this, callback as any)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *takeWhile<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value)) {
        next_value = yield real_value;
      }
      else {
        return;
      }

      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.dropWhile.call(this, callback as any)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *dropWhile<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value: unknown;
    let finished = false;

    while (!value.done) {
      const real_value = value.value;

      if (!finished && await callback(real_value)) {
        value = await it.next(next_value as any);
        continue;
      }

      finished = true;
      next_value = yield real_value;
      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.fuse.call(this)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *fuse<T>(this: AsyncIterator<T>) {
    const it = this;
    let value = await it.next();
    let next_value: unknown;

    while (!value.done) {
      const real_value = value.value;

      if (real_value !== undefined && real_value !== null) {
        next_value = yield real_value;
      }
      else {
        return;
      }

      value = await it.next(next_value as any);
    }

    return value.value;
  }

  /** Partition {true} elements to first array, {false} elements to second one. */
  async partition(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const partition1: T[] = [], partition2: T[] = [];

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value))
        partition1.push(real_value);
      else
        partition2.push(real_value);

      value = await it.next();
    }

    return [partition1, partition2];
  }

  /** Group by objects by key according to returned key for each object. */
  async groupBy<K extends string | number | symbol>(callback: (value: T) => K | PromiseLike<K>) {
    const grouped: { [Key in K]: T[] } = {} as any;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;
      const key = await callback(real_value);

      if (key in grouped) {
        grouped[key].push(real_value);
      }
      else {
        grouped[key] = [real_value];
      }

      value = await it.next();
    }

    return grouped;
  }

  /** Index this iterator objects in a {Map} with key obtained through {keyGetter}. */
  async toIndexedItems<K>(keyGetter: (value: T) => K | PromiseLike<K>) {
    const map = new Map<K, T>();
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const realValue = value.value;
      const key = await keyGetter(realValue);
      map.set(key, realValue);

      value = await it.next();
    }

    return map;
  }

  /**
   * Iterate over items present in both current collection and {otherItems} iterable.
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable!
   */
  intersection<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.intersection.call(this, otherItems, isSameItemCallback as any)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *intersection<T, O>(
    this: AsyncIterator<T>,
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) {
    const otherItemsCollection = await HAsyncIterator.from(otherItems).toArray();
    const it = this;
    let value = await it.next();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Yield real_value if any {item} match {real_value}
      if (await asyncSome(otherItemsCollection, item => isSameItemCallback(realValue, item))) {
        nextValue = yield realValue;
      }

      value = await it.next(nextValue as any);
    }

    return value.value;
  }

  /**
   * Iterate over items present only in current collection, not in {otherItems} iterable.
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable!
   */
  difference<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.difference.call(this, otherItems, isSameItemCallback as any)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *difference<T, O>(
    this: AsyncIterator<T>,
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) {
    const it = this;
    let value = await it.next();
    const otherItemsCollection = await HAsyncIterator.from(otherItems).toArray();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Emit {realValue} only if no value matches in other items
      const currentItemPresentInOtherItems = await asyncSome(otherItemsCollection, item => isSameItemCallback(realValue, item));
      if (!currentItemPresentInOtherItems) {
        nextValue = yield realValue;
      }

      value = await it.next(nextValue as any);
    }

    return value.value;
  }

  /**
   * Iterate over items present only in current collection or only in {otherItems} iterable, but not in both.
   * **Warning**: This is a O(n*m) operation and this will consume {otherItems} iterator/iterable!
   */
  symmetricDifference<O>(
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) : HAsyncIterator<T | O, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.symmetricDifference.call(this, otherItems, isSameItemCallback as any)) as HAsyncIterator<T | O, TReturn, TNext>;
  }

  static async *symmetricDifference<T, O>(
    this: AsyncIterator<T>,
    otherItems: AsyncIteratorOrIterable<O>,
    isSameItemCallback: (value: T, other: O) => boolean | PromiseLike<boolean> = Object.is,
  ) {
    const it = this;
    let value = await it.next();
    const otherItemsCollection = await HAsyncIterator.from(otherItems).toArray();
    const presentInBothCollections = new Set<O>();
    let nextValue: unknown;

    while (!value.done) {
      const realValue = value.value;

      // Try to find same item as current in {other_items_collection}
      const otherItem = await asyncFindIndex(otherItemsCollection, item => isSameItemCallback(realValue, item));

      if (otherItem !== -1) {
        presentInBothCollections.add(otherItemsCollection[otherItem]);
      }
      else {
        // No match in other collection, can emit it
        nextValue = yield realValue;
      }

      value = await it.next(nextValue as any);
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
  async findIndex(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let i = 0;

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value))
        return i;

      value = await it.next();
      i++;
    }

    return -1;
  }

  /** Only works if it is a number iterator. Returns the maximum of iterator. */
  async max() {
    let max = -Infinity;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = Number(value.value ?? 0);
      if (isNaN(real_value)) {
        throw new RangeError('Iterator should return numbers only, or null or undefined.');
      }

      if (max < real_value)
        max = real_value;

      value = await it.next();
    }

    return max;
  }

  /** Only works if it is a number iterator. Returns the minimum of iterator. */
  async min() {
    let min = Infinity;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = Number(value.value ?? 0);
      if (isNaN(real_value)) {
        throw new RangeError('Iterator should return numbers only, or null or undefined.');
      }

      if (min > real_value)
        min = real_value;

      value = await it.next();
    }

    return min;
  }

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HAsyncIterator<T, TReturn, TNext> {
    return new HAsyncIterator(HAsyncIterator.cycle.call(this)) as HAsyncIterator<T, TReturn, TNext>;
  }

  static async *cycle<T>(this: AsyncIterator<T>) {
    const values: T[] = [];

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;
      values.push(real_value);

      const next_value: unknown = yield real_value;
      value = await it.next(next_value as any);
    }

    while (true) {
      for (const value of values) {
        yield value;
      }
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

async function asyncFindIndex<T>(array: T[], finder: (value: T) => boolean | PromiseLike<boolean>) {
  for (let i = 0; i < array.length; i++) {
    if (await finder(array[i])) {
      return i;
    }
  }
  return -1;
}

async function asyncSome<T>(array: T[], matcher: (value: T) => boolean | PromiseLike<boolean>) {
  for (const item of array) {
    if (await matcher(item)) {
      return true;
    }
  }
  return false;
}
