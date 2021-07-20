import * as assert from 'assert';
import { iter, aiter, wrap, awrap, HIterator } from '.';
import { IteratorOrIterable } from './types';

function toait<T>(iterator: IteratorOrIterable<T>) {
  return HIterator.toAsyncIterator(iterator);
}

function assertCommunication() {
  function* testCommunication(): Generator<number, any, string> {
    // Started with .next parameter as 'Hello', but cannot access it.
    let testCommu = yield 1;
    assert.strictEqual(testCommu, 'World');
    testCommu = yield 2;
    assert.strictEqual(testCommu, 'Third');
    testCommu = yield 3;
    assert.strictEqual(testCommu, 'Quattro');
    testCommu = yield 4;
    assert.strictEqual(testCommu, 'Cinq');
    // it is over, .next() call should return { done: true, value: 'Over' }
    return 'Over';
  }

  // All methods should properly give .next() value and yield the good value.
  const testIt = iter(testCommunication())
    .map(e => e * 2)
    .filter(e => !!e);

  assert.deepStrictEqual(testIt.next('Hello'), { value: 2, done: false }); // 'Hello' should not be given ; its normal, it is iterator first call
  assert.deepStrictEqual(testIt.next('World'), { value: 4, done: false });
  assert.deepStrictEqual(testIt.next('Third'), { value: 6, done: false });
  assert.deepStrictEqual(testIt.next('Quattro'), { value: 8, done: false });
  assert.deepStrictEqual(testIt.next('Cinq'), { value: 'Over', done: true });
}

async function assertAsyncCommunication() {
  async function* testCommunication(): AsyncGenerator<number, any, string> {
    // Started with .next parameter as 'Hello', but cannot access it.
    let testCommu = yield Promise.resolve(1);
    assert.strictEqual(testCommu, 'World');
    testCommu = yield Promise.resolve(2);
    assert.strictEqual(testCommu, 'Third');
    testCommu = yield Promise.resolve(3);
    assert.strictEqual(testCommu, 'Quattro');
    testCommu = yield Promise.resolve(4);
    assert.strictEqual(testCommu, 'Cinq');
    // it is over, .next() call should return { done: true, value: 'Over' }
    return 'Over';
  }

  // All methods should properly give .next() value and yield the good value.
  const testIt = aiter(testCommunication())
    .map(e => e * 2)
    .filter(e => !!e);

  assert.deepStrictEqual(await testIt.next('Hello'), { value: 2, done: false }); // 'Hello' should not be given ; its normal, it is iterator first call
  assert.deepStrictEqual(await testIt.next('World'), { value: 4, done: false });
  assert.deepStrictEqual(await testIt.next('Third'), { value: 6, done: false });
  assert.deepStrictEqual(await testIt.next('Quattro'), { value: 8, done: false });
  assert.deepStrictEqual(await testIt.next('Cinq'), { value: 'Over', done: true });
}

function assertSetMethods() {
  const items1 = [1, 2, 3, 4], items2 = [3, 4, 5, 6, 7], items3 = [6, 7, 8, 9];

  assert.deepStrictEqual(iter(items1).intersection(items2).toArray(), [3, 4]);
  assert.deepStrictEqual(iter(items1).intersection(items3).toArray(), []);
  assert.deepStrictEqual(iter(items2).intersection(items3).toArray(), [6, 7]);

  assert.deepStrictEqual(iter(items1).difference(items2).toArray(), [1, 2]);
  assert.deepStrictEqual(iter(items1).difference(items3).toArray(), [1, 2, 3, 4]);
  assert.deepStrictEqual(iter(items2).difference(items3).toArray(), [3, 4, 5]);

  assert.deepStrictEqual(iter(items1).symmetricDifference(items2).toArray(), [1, 2, 5, 6, 7]);
  assert.deepStrictEqual(iter(items1).symmetricDifference(items3).toArray(), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.deepStrictEqual(iter(items2).symmetricDifference(items3).toArray(), [3, 4, 5, 8, 9]);
}

async function assertAsyncSetMethods() {
  const items1 = [1, 2, 3, 4], items2 = [3, 4, 5, 6, 7], items3 = [6, 7, 8, 9];

  assert.deepStrictEqual(await aiter(toait(items1)).intersection(toait(items2)).toArray(), [3, 4]);
  assert.deepStrictEqual(await aiter(toait(items1)).intersection(toait(items3)).toArray(), []);
  assert.deepStrictEqual(await aiter(toait(items2)).intersection(toait(items3)).toArray(), [6, 7]);

  assert.deepStrictEqual(await aiter(toait(items1)).difference(toait(items2)).toArray(), [1, 2]);
  assert.deepStrictEqual(await aiter(toait(items1)).difference(toait(items3)).toArray(), [1, 2, 3, 4]);
  assert.deepStrictEqual(await aiter(toait(items2)).difference(toait(items3)).toArray(), [3, 4, 5]);

  assert.deepStrictEqual(await aiter(toait(items1)).symmetricDifference(toait(items2)).toArray(), [1, 2, 5, 6, 7]);
  assert.deepStrictEqual(await aiter(toait(items1)).symmetricDifference(toait(items3)).toArray(), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.deepStrictEqual(await aiter(toait(items2)).symmetricDifference(toait(items3)).toArray(), [3, 4, 5, 8, 9]);
}

function* numbers(): Iterator<number> {
  yield 1;
  yield 2;
  yield 3;
}

function* dropWhileCompatible(): Iterator<number> {
  yield 1;
  yield 2;
  yield 3;
  yield 1;
}

function* takeWhileCompatible(): Iterator<number> {
  yield 1;
  yield 2;
  yield 4;
  yield 0;
  yield 1;
}

function* fuseCompatible(): Iterator<number | undefined> {
  yield 1;
  yield 2;
  yield 3;
  yield undefined;
  yield 5;
}

async function* asyncNumbers(): AsyncIterator<number> {
  yield 1;
  yield 2;
  yield 3;
}

async function* asyncDropWhileCompatible(): AsyncIterator<number> {
  yield 1;
  yield 2;
  yield 3;
  yield 1;
}

async function* asyncTakeWhileCompatible(): AsyncIterator<number> {
  yield 1;
  yield 2;
  yield 4;
  yield 0;
  yield 1;
}

async function* asyncFuseCompatible(): AsyncIterator<number | undefined> {
  yield 1;
  yield 2;
  yield 3;
  yield undefined;
  yield 5;
}


let n = () => iter(numbers());
let dwc = () => iter(dropWhileCompatible());
let twc = () => iter(takeWhileCompatible());
let fc = () => iter(fuseCompatible());

let an = () => aiter(asyncNumbers());
let adwc = () => aiter(asyncDropWhileCompatible());
let atwc = () => aiter(asyncTakeWhileCompatible());
let afc = () => aiter(asyncFuseCompatible());

async function main() {
  let collected: any = n()
    .map(e => e * 2)
    .take(2)
    .toArray(); // [2, 4] ;

  assert.deepStrictEqual(collected, [2, 4]);

  collected = await an()
    .filter(e => !!(e % 2))
    .map(e => String(e))
    .toArray(); // Promise<["1", "3"]>

  assert.deepStrictEqual(collected, ['1', '3']);

  // SYNC ITERATOR TEST
  // .map
  assert.deepStrictEqual(n().map(e => e * 2).toArray(), [2, 4, 6]);
  // .filter
  assert.deepStrictEqual(n().filter(e => e % 2 === 0).toArray(), [2]);
  // .take
  assert.deepStrictEqual(n().take(2).toArray(), [1, 2]);
  // .drop
  assert.deepStrictEqual(n().drop(1).toArray(), [2, 3]);
  // .asIndexedPairs
  assert.deepStrictEqual(n().asIndexedPairs().toArray(), [[0, 1], [1, 2], [2, 3]]);
  // .flatMap
  assert.deepStrictEqual(n().flatMap(e => [e, -e]).toArray(), [1, -1, 2, -2, 3, -3]);
  // .find
  assert.deepStrictEqual(n().find(e => e === 2), 2);
  assert.deepStrictEqual(n().find((e: number) => e === 4), undefined);
  // .every
  assert.strictEqual(n().every(e => e > 0), true);
  assert.strictEqual(n().every(e => e <= 2), false);
  // .some
  assert.strictEqual(n().some(e => e <= 2), true);
  assert.strictEqual(n().some(e => e <= 0), false);
  // .toArray
  assert.deepStrictEqual(n().toArray(), [1, 2, 3]);
  // .reduce
  assert.strictEqual(n().reduce((acc, val) => acc + val), 6);
  assert.strictEqual(n().reduce((acc, val) => acc + val, 0), 6);
  assert.strictEqual(n().reduce((acc, val) => acc - val, 0), -6);
  // .forEach
  assert.deepStrictEqual(n().forEach(() => null), undefined);

  // Non spec for sync iterator
  // .join
  assert.strictEqual(n().join(','), '1,2,3');
  // .count
  assert.strictEqual(n().count(), 3);
  // .chain
  assert.deepStrictEqual(n().chain(n()).toArray(), [1, 2, 3, 1, 2, 3]);
  // .zip
  assert.deepStrictEqual(n().zip(n()).toArray(), [[1, 1], [2, 2], [3, 3]]);
  // .dropWhile
  assert.deepStrictEqual(dwc().dropWhile(e => e <= 2).toArray(), [3, 1]);
  // .takeWhile
  assert.deepStrictEqual(twc().takeWhile(e => e <= 2).toArray(), [1, 2]);
  // .fuse
  assert.deepStrictEqual(fc().fuse().toArray(), [1, 2, 3]);
  // .partition
  assert.deepStrictEqual(n().partition(c => c <= 2), [[1, 2], [3]]);
  // .findIndex
  assert.strictEqual(n().findIndex(e => e === 2), 1);
  // .max
  assert.strictEqual(n().max(), 3);
  // .min
  assert.strictEqual(n().min(), 1);
  // .groupBy
  assert.deepStrictEqual(n().groupBy(v => v % 2 ? 'odd' : 'even'), { odd: [1, 3], even: [2] });
  // .toIndexedItems
  assert.deepStrictEqual([...n().toIndexedItems(v => v).entries()], [[1, 1], [2, 2], [3, 3]]);

  // Non testable with assert : .cycle
  let i = 1000;
  let cycle_generator: any = n().cycle();
  while (--i) {
    const value = cycle_generator.next();
    assert.strictEqual([1, 2, 3].includes(value.value as number), true);
  }
  assert.strictEqual(i, 0);

  // Static methods
  // .range
  assert.deepStrictEqual(iter.range(5).toArray(), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(iter.range(1, 5).toArray(), [1, 2, 3, 4]);
  assert.deepStrictEqual(iter.range(1, 11, 2).toArray(), [1, 3, 5, 7, 9]);
  // .repeat
  assert.deepStrictEqual(iter.repeat(4).take(4).toArray(), [4, 4, 4, 4]);
  assert.deepStrictEqual(iter.repeat(4, 4).toArray(), [4, 4, 4, 4]);
  assert.deepStrictEqual(iter.repeat(4, 6).toArray(), [4, 4, 4, 4, 4, 4]);

  assertCommunication();
  assertSetMethods();

  /// END OF sync iterator tests

  // ASYNC ITERATOR TESTS
  // .map
  assert.deepStrictEqual(await an().map(e => e * 2).toArray(), [2, 4, 6]);
  assert.deepStrictEqual(await an().map(async e => e * 2).toArray(), [2, 4, 6]);
  // .filter
  assert.deepStrictEqual(await an().filter(e => e % 2 === 0).toArray(), [2]);
  assert.deepStrictEqual(await an().filter(async e => e % 2 === 0).toArray(), [2]);
  // .take
  assert.deepStrictEqual(await an().take(2).toArray(), [1, 2]);
  // .drop
  assert.deepStrictEqual(await an().drop(1).toArray(), [2, 3]);
  // .asIndexedPairs
  assert.deepStrictEqual(await an().asIndexedPairs().toArray(), [[0, 1], [1, 2], [2, 3]]);
  // .flatMap
  assert.deepStrictEqual(await an().flatMap(e => [e, -e]).toArray(), [1, -1, 2, -2, 3, -3]);
  assert.deepStrictEqual(await an().flatMap(async e => [e, -e]).toArray(), [1, -1, 2, -2, 3, -3]);
  // .find
  assert.deepStrictEqual(await an().find(e => e === 2), 2);
  assert.strictEqual(await an().find(async (e: number) => e === 4), undefined);
  // .every
  assert.strictEqual(await an().every(e => e > 0), true);
  assert.strictEqual(await an().every(e => e <= 2), false);
  assert.strictEqual(await an().every(async e => e > 0), true);
  assert.strictEqual(await an().every(async e => e <= 2), false);
  // .some
  assert.strictEqual(await an().some(e => e <= 2), true);
  assert.strictEqual(await an().some(e => e <= 0), false);
  assert.strictEqual(await an().some(async e => e <= 2), true);
  assert.strictEqual(await an().some(async e => e <= 0), false);
  // .toArray
  assert.deepStrictEqual(await an().toArray(), [1, 2, 3]);
  // .reduce
  assert.deepStrictEqual(await an().reduce((acc: number, val) => acc + val), 6);
  assert.deepStrictEqual(await an().reduce((acc, val) => acc + val, 0), 6);
  assert.deepStrictEqual(await an().reduce((acc, val) => acc - val, 0), -6);
  assert.deepStrictEqual(await an().reduce(async (acc: number, val) => acc + val), 6);
  assert.deepStrictEqual(await an().reduce(async (acc, val) => acc + val, 0), 6);
  assert.deepStrictEqual(await an().reduce(async (acc, val) => acc - val, 0), -6);
  // .forEach
  assert.deepStrictEqual(await an().forEach(() => null), undefined);
  assert.deepStrictEqual(await an().forEach(async () => null), undefined);

  // Non spec for sync iterator
  // .join
  assert.strictEqual(await an().join(','), '1,2,3');
  // .count
  assert.strictEqual(await an().count(), 3);
  // .chain
  assert.deepStrictEqual(await an().chain(an()).toArray(), [1, 2, 3, 1, 2, 3]);
  // .zip
  assert.deepStrictEqual(await an().zip(an()).toArray(), [[1, 1], [2, 2], [3, 3]]);
  // .dropWhile
  assert.deepStrictEqual(await adwc().dropWhile(e => e <= 2).toArray(), [3, 1]);
  assert.deepStrictEqual(await adwc().dropWhile(async e => e <= 2).toArray(), [3, 1]);
  // .takeWhile
  assert.deepStrictEqual(await atwc().takeWhile(e => e <= 2).toArray(), [1, 2]);
  assert.deepStrictEqual(await atwc().takeWhile(async e => e <= 2).toArray(), [1, 2]);
  // .fuse
  assert.deepStrictEqual(await afc().fuse().toArray(), [1, 2, 3]);
  // .partition
  assert.deepStrictEqual(await an().partition(c => c <= 2), [[1, 2], [3]]);
  assert.deepStrictEqual(await an().partition(async c => c <= 2), [[1, 2], [3]]);
  // .findIndex
  assert.strictEqual(await an().findIndex(e => e === 2), 1);
  assert.strictEqual(await an().findIndex(async e => e === 2), 1);
  // .max
  assert.strictEqual(await an().max(), 3);
  // .min
  assert.strictEqual(await an().min(), 1);
  // .groupBy
  assert.deepStrictEqual(await an().groupBy(v => v % 2 ? 'odd' : 'even'), { odd: [1, 3], even: [2] });
  // .toIndexedItems
  assert.deepStrictEqual([...(await an().toIndexedItems(v => v)).entries()], [[1, 1], [2, 2], [3, 3]]);

  await assertAsyncCommunication();
  await assertAsyncSetMethods();

  // Non testable with assert : .cycle
  i = 1000;
  cycle_generator = an().cycle();
  await (async () => {
    while (--i) {
      const value = await cycle_generator.next();
      assert.strictEqual([1, 2, 3].includes(value.value as number), true);
    }
    assert.strictEqual(i, 0);
  })();

  console.log('All tests passed successfully.');
}

(async () => {
  console.log('Tests with iter()');
  await main();

  // Test of wrapped

  n = wrap(numbers);
  dwc = wrap(dropWhileCompatible);
  twc = wrap(takeWhileCompatible);
  fc = wrap(fuseCompatible);
  an = awrap(asyncNumbers);
  adwc = awrap(asyncDropWhileCompatible);
  atwc = awrap(asyncTakeWhileCompatible);
  afc = awrap(asyncFuseCompatible);

  console.log('Tests with wrap()');
  await main();
})();

