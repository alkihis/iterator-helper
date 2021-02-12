const IteratorSlot = Symbol('IteratorSlot');

type Parameters<T, R> = T extends (... args: infer T) => R ? T : never;

export function wrap<It, T, R>(func: (...args: Parameters<T, R>) => R) {
  return function (this: any, ...args: any) {
    // @ts-expect-error
    return iter(func.call(this, ...args)) as HIterator<It>;
  };
}

export function awrap<It, T, R>(func: (...args: Parameters<T, R>) => R) {
  return function (this: any, ...args: any) {
    // @ts-expect-error
    return aiter(func.call(this, ...args)) as HAsyncIterator<It>;
  };
}

export function aiter<T>(item: AsyncIterator<T> | AsyncIterator<T>) {
  if (Symbol.asyncIterator in item) {
    // @ts-expect-error
    return new HAsyncIterator(item[Symbol.asyncIterator]() as AsyncIterator<T>);
  }
  return new HAsyncIterator(item as AsyncIterator<T>);
}

export class HAsyncIterator<T> implements AsyncIterator<T> {
  [IteratorSlot]: AsyncIterator<T>;

  constructor(iterator?: AsyncIterator<T>) {
    this[IteratorSlot] = iterator ?? this;
  }

  next(val?: any) {
    return this[IteratorSlot].next(val);
  }

  throw(val?: any) {
    return this[IteratorSlot].throw?.(val) ?? Promise.resolve({ value: undefined, done: true });
  }

  return(val?: any) {
    return this[IteratorSlot].return?.(val) ?? Promise.resolve({ value: undefined, done: true });
  }

  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (value: T) => R | PromiseLike<R>) : HAsyncIterator<R> {
    return new HAsyncIterator(HAsyncIterator.map.call(this, callback as any)) as HAsyncIterator<R>;
  }

  static async *map<T, R>(this: AsyncIterator<T>, callback: (value: T) => R | PromiseLike<R>) {
    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = await callback(value.value);
      const next_value = yield real_value;
      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.filter.call(this, callback as any)) as HAsyncIterator<T>;
  }

  static async *filter<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value)) {
        next_value = yield real_value;
      }

      value = await it.next(next_value);
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
    const values = [];

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
  take(limit: number) : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.take.call(this, limit)) as HAsyncIterator<T>;
  }

  static async *take<T>(this: AsyncIterator<T>, limit: number) {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    const it = this;
    let value = await it.next();
    let next_value;
    let remaining = limit;

    while (!value.done) {
      if (remaining <= 0)
        return;

      const real_value = value.value;

      next_value = yield real_value;
      value = await it.next(next_value);
      remaining--;
    }

    return value.value;
  }

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.drop.call(this, limit)) as HAsyncIterator<T>;
  }

  static async *drop<T>(this: AsyncIterator<T>, limit: number) {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    const it = this;
    let value = await it.next();
    let next_value;
    let remaining = limit;

    while (!value.done) {
      if (remaining > 0) {
        remaining--;
        value = await it.next(next_value);
        continue;
      }

      const real_value = value.value;

      next_value = yield real_value;
      value = await it.next(next_value);
      remaining--;
    }

    return value.value;
  }

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HAsyncIterator<[number, T]> {
    return new HAsyncIterator(HAsyncIterator.asIndexedPairs.call(this)) as HAsyncIterator<[number, T]>;
  }

  static async *asIndexedPairs<T>(this: AsyncIterator<T>) {
    let index = 0;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;
      const next_value = yield [index, real_value];
      index++
      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => AsyncIterator<R> | R | PromiseLike<AsyncIterator<R>> | PromiseLike<R>) : HAsyncIterator<R> {
    return new HAsyncIterator(HAsyncIterator.flatMap.call(this, mapper as any)) as HAsyncIterator<R>;
  }

  static async *flatMap<T, R>(this: AsyncIterator<T>, mapper: (value: T) => AsyncIterator<R> | R | PromiseLike<AsyncIterator<R>> | PromiseLike<R>) {
    if (typeof mapper !== 'function') {
      throw new TypeError('Mapper must be a function.');
    }

    const it = this;
    let value = await it.next();
    let next_value;

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
      acc = (await it.next()).value;
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
  chain<I>(...iterables: AsyncIterableIterator<I>[]) : HAsyncIterator<T | I> {
    return new HAsyncIterator(HAsyncIterator.chain.call(this, ...iterables)) as HAsyncIterator<T | I>;
  }

  static async *chain<T, I>(this: AsyncIterableIterator<T>, ...iterables: AsyncIterableIterator<I>[]) {
    yield* this;

    for (const it of iterables) {
      yield* it;
    }
  }

  /** Iterate through multiple iterators together. */
  zip<O>(...others: AsyncIterableIterator<O>[]) : HAsyncIterator<(T | O)[]> {
    return new HAsyncIterator(HAsyncIterator.zip.call(this, ...others)) as HAsyncIterator<(T | O)[]>;
  }

  static async *zip<T, O>(this: AsyncIterableIterator<T>, ...others: AsyncIterableIterator<O>[]) : AsyncIterator<(T | O)[]> {
    const it_array = [this, ...others].map((e: any) => Symbol.asyncIterator in e ? e[Symbol.asyncIterator]() : e as AsyncIterator<T | O>);
    let values = await Promise.all(it_array.map(e => e.next()));

    while (values.every(e => !e.done)) {
      yield values.map(e => e.value);
      values = await Promise.all(it_array.map(e => e.next()));
    }
  }

  /** Continue iterator until {callback} return a falsy value. */
  takeWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.takeWhile.call(this, callback as any)) as HAsyncIterator<T>;
  }

  static async *takeWhile<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (await callback(real_value)) {
        next_value = yield real_value;
      }
      else {
        return;
      }

      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean | PromiseLike<boolean>) : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.dropWhile.call(this, callback as any)) as HAsyncIterator<T>;
  }

  static async *dropWhile<T>(this: AsyncIterator<T>, callback: (value: T) => boolean | PromiseLike<boolean>) {
    const it = this;
    let value = await it.next();
    let next_value;
    let finished = false;

    while (!value.done) {
      const real_value = value.value;

      if (!finished && await callback(real_value)) {
        value = await it.next(next_value);
        continue;
      }

      finished = true;
      next_value = yield real_value;
      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.fuse.call(this)) as HAsyncIterator<T>;
  }

  static async *fuse<T>(this: AsyncIterator<T>) {
    const it = this;
    let value = await it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (real_value !== undefined && real_value !== null) {
        next_value = yield real_value;
      }
      else {
        return;
      }

      value = await it.next(next_value);
    }

    return value.value;
  }

  /** Partition {true} elements to first array, {false} elements to second one. */
  async partition(callback: (value: T) => boolean | PromiseLike<boolean>) {
    const partition1 = [], partition2 = [];

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

  /** Only works if it. is a number iterator. Returns the maximum of iterator. */
  async max() {
    let max = -Infinity;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value as any as number;

      if (max < real_value)
        max = real_value;

      value = await it.next();
    }

    return max;
  }

  /** Only works if it. is a number iterator. Returns the minimum of iterator. */
  async min() {
    let min = Infinity;

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value as any as number;

      if (min > real_value)
        min = real_value;

      value = await it.next();
    }

    return min;
  }

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HAsyncIterator<T> {
    return new HAsyncIterator(HAsyncIterator.cycle.call(this)) as HAsyncIterator<T>;
  }

  static async *cycle<T>(this: AsyncIterator<T>) {
    const values = [];

    const it = this;
    let value = await it.next();

    while (!value.done) {
      const real_value = value.value;
      values.push(real_value);

      const next_value = yield real_value;
      value = await it.next(next_value);
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

export function iter<T>(item: Iterator<T> | Iterable<T>) {
  if (Symbol.iterator in item) {
    // @ts-expect-error
    return new HIterator(item[Symbol.iterator]() as Iterator<T>);
  }
  return new HIterator(item as Iterator<T>);
}

export class HIterator<T> implements Iterator<T> {
  [IteratorSlot]: Iterator<T>;

  constructor(iterator?: Iterator<T>) {
    this[IteratorSlot] = iterator ?? this;
  }

  next(val?: any) {
    return this[IteratorSlot].next(val);
  }

  throw(val?: any) {
    return this[IteratorSlot].throw?.(val) ?? { value: undefined, done: true };
  }

  return(val?: any) {
    return this[IteratorSlot].return?.(val) ?? { value: undefined, done: true };
  }

  /** Map each value of iterator to another value via {callback}. */
  map<R>(callback: (element: T) => R) : HIterator<R> {
    return new HIterator(HIterator.map.call(this, callback as any)) as HIterator<R>;
  }

  static *map<T, R>(this: Iterator<T>, callback: (element: T) => R) {
    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = callback(value.value);
      const next_value = yield real_value;
      value = it.next(next_value);
    }

    return value.value;
  }

  /** Each value is given through {callback}, return `true` if value is needed into returned iterator. */
  filter(callback: (value: T) => boolean) : HIterator<T> {
    return new HIterator(HIterator.filter.call(this, callback as any)) as HIterator<T>;
  }

  static *filter<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;
      if (callback(real_value)) {
        next_value = yield real_value;
        value = it.next(next_value);
      }
      else {
        value = it.next(next_value);
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
    const values = [];

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
  take(limit: number) : HIterator<T> {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    return new HIterator(HIterator.take.call(this, limit)) as HIterator<T>;
  }

  static *take<T>(this: Iterator<T>, limit: number) {
    const it = this;
    let value = it.next();
    let remaining = limit;
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (remaining <= 0)
        return;

      next_value = yield real_value;
      value = it.next(next_value);
      remaining--;
    }

    return value.value;
  }

  /** Create a new iterator that skip {limit} items from source iterator, then yield all values. */
  drop(limit: number) : HIterator<T> {
    limit = Number(limit);
    if (limit < 0)
      throw new RangeError('Invalid limit.');

    return new HIterator(HIterator.drop.call(this, limit)) as HIterator<T>;
  }

  static *drop<T>(this: Iterator<T>, limit: number) {
    const it = this;
    let value = it.next();
    let remaining = limit;
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (remaining > 0) {
        value = it.next(next_value);
        remaining--;
        continue;
      }

      next_value = yield real_value;
      value = it.next(next_value);
    }

    return value.value;
  }

  /** Get a pair [index, value] for each remaining value of iterable. */
  asIndexedPairs() : HIterator<[number, T]> {
    return new HIterator(HIterator.asIndexedPairs.call(this)) as HIterator<[number, T]>;
  }

  static *asIndexedPairs<T>(this: Iterator<T>) {
    const it = this;
    let value = it.next();
    let index = 0;

    while (!value.done) {
      const real_value = value.value;
      const next_value = yield [index, real_value];;
      value = it.next(next_value);
      index++;
    }

    return value.value;
  }

  /** Like map, but you can return a new iterator that will be flattened. */
  flatMap<R>(mapper: (value: T) => IterableIterator<R> | R) : HIterator<R> {
    if (typeof mapper !== 'function') {
      throw new TypeError('Mapper must be a function.');
    }

    return new HIterator(HIterator.flatMap.call(this, mapper as any)) as HIterator<R>;
  }

  static *flatMap<T, R>(this: Iterator<T>, mapper: (value: T) => IterableIterator<R> | R) : Iterator<R> {
    const it = this;
    let value = it.next();
    let next_value;

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

      value = it.next(next_value);
    }

    return value.value;
  }

  /** Accumulate each item inside **acc** for each value **value**. */
  reduce<V>(reducer: (acc: V, value: T) => V, initial_value?: V) {
    let acc = initial_value;

    const it = this;
    if (acc === undefined) {
      acc = it.next().value;
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
  chain<I>(...iterables: IterableIterator<I>[]) : HIterator<T | I> {
    return new HIterator(HIterator.chain.apply(this, iterables)) as HIterator<T | I>;
  }

  static *chain<T, I>(this: IterableIterator<T>, ...iterables: IterableIterator<I>[]) {
    yield* this;

    for (const it of iterables) {
      yield* it;
    }
  }

  /** Iterate through multiple iterators together. */
  zip<O>(...others: IterableIterator<O>[]) : HIterator<(T | O)[]> {
    return new HIterator(HIterator.zip.apply(this, others)) as HIterator<(T | O)[]>;
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
  takeWhile(callback: (value: T) => boolean) : HIterator<T> {
    return new HIterator(HIterator.takeWhile.call(this, callback as any)) as HIterator<T>;
  }

  static *takeWhile<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (callback(real_value))
        next_value = yield real_value;
      else
        return;

      value = it.next(next_value);
    }

    return value.value;
  }

  /** Skip elements until {callback} return a truthy value. */
  dropWhile(callback: (value: T) => boolean) : HIterator<T> {
    return new HIterator(HIterator.dropWhile.call(this, callback as any)) as HIterator<T>;
  }

  static *dropWhile<T>(this: Iterator<T>, callback: (value: T) => boolean) {
    const it = this;
    let value = it.next();
    let next_value;
    let finished = false;

    while (!value.done) {
      const real_value = value.value;

      if (!finished && callback(real_value)) {
        value = it.next(next_value);
        continue;
      }

      finished = true;
      next_value = yield real_value;

      value = it.next(next_value);
    }

    return value.value;
  }

  /** Continue iterator until `null` or `undefined` is encountered. */
  fuse() : HIterator<T> {
    return new HIterator(HIterator.fuse.call(this)) as HIterator<T>;
  }

  static *fuse<T>(this: Iterator<T>) {
    const it = this;
    let value = it.next();
    let next_value;

    while (!value.done) {
      const real_value = value.value;

      if (real_value !== undefined && real_value !== null)
        next_value = yield real_value;
      else
        return;

      value = it.next(next_value);
    }

    return value.value;
  }

  /** Partition {true} elements to first array, {false} elements to second one. */
  partition(callback: (value: T) => boolean) {
    const partition1 = [], partition2 = [];

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

  /** Only works if it. is a number iterator. Returns the maximum of iterator. */
  max() {
    let max = -Infinity;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value as any as number;

      if (max < real_value)
        max = real_value;

      value = it.next();
    }

    return max;
  }

  /** Only works if it. is a number iterator. Returns the minimum of iterator. */
  min() {
    let min = Infinity;

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value as any as number;

      if (min > real_value)
        min = real_value;

      value = it.next();
    }

    return min;
  }

  /** When iterator ends, go back to the first item then loop. Indefinitively. */
  cycle() : HIterator<T> {
    return new HIterator(HIterator.cycle.call(this)) as HIterator<T>;
  }

  static *cycle<T>(this: Iterator<T>) {
    const values = [];

    const it = this;
    let value = it.next();

    while (!value.done) {
      const real_value = value.value;
      values.push(real_value);

      const next_value = yield real_value;
      value = it.next(next_value);
    }

    while (true) {
      yield* values;
    }
  }

  [Symbol.iterator]() {
    return this;
  }
}
