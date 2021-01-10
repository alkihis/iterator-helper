import './index';
import * as assert from 'assert';
import { iter, aiter, wrap, awrap } from './ItHelper';

function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

function* dropWhileCompatible() {
  yield 1;
  yield 2;
  yield 3;
  yield 1;
}

function* takeWhileCompatible() {
  yield 1;
  yield 2;
  yield 4;
  yield 0;
  yield 1;
}

function* fuseCompatible() {
  yield 1;
  yield 2;
  yield 3;
  yield undefined;
  yield 5;
}

async function* asyncNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

async function* asyncDropWhileCompatible() {
  yield 1;
  yield 2;
  yield 3;
  yield 1;
}

async function* asyncTakeWhileCompatible() {
  yield 1;
  yield 2;
  yield 4;
  yield 0;
  yield 1;
}

async function* asyncFuseCompatible() {
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

  // Non testable with assert : .cycle
  let i = 1000;
  let cycle_generator: any = n().cycle();
  while (--i) {
    const value = cycle_generator.next();
    assert.strictEqual([1, 2, 3].includes(value.value as number), true);
  }
  assert.strictEqual(i, 0);

  /// END OF sync iterator tests

  // ASYNC ITERATOR TESTS
  // .map
  assert.deepStrictEqual(await an().map(e => e * 2).toArray(), [2, 4, 6]);
  // .filter
  assert.deepStrictEqual(await an().filter(e => e % 2 === 0).toArray(), [2]);
  // .take
  assert.deepStrictEqual(await an().take(2).toArray(), [1, 2]);
  // .drop
  assert.deepStrictEqual(await an().drop(1).toArray(), [2, 3]);
  // .asIndexedPairs
  assert.deepStrictEqual(await an().asIndexedPairs().toArray(), [[0, 1], [1, 2], [2, 3]]);
  // .flatMap
  assert.deepStrictEqual(await an().flatMap(e => [e, -e]).toArray(), [1, -1, 2, -2, 3, -3]);
  // .find
  assert.deepStrictEqual(await an().find(e => e === 2), 2);
  assert.strictEqual(await an().find((e: number) => e === 4), undefined);
  // .every
  assert.strictEqual(await an().every(e => e > 0), true);
  assert.strictEqual(await an().every(e => e <= 2), false);
  // .some
  assert.strictEqual(await an().some(e => e <= 2), true);
  assert.strictEqual(await an().some(e => e <= 0), false);
  // .toArray
  assert.deepStrictEqual(await an().toArray(), [1, 2, 3]);
  // .reduce
  assert.deepStrictEqual(await an().reduce((acc: number, val) => acc + val), 6);
  assert.deepStrictEqual(await an().reduce((acc, val) => acc + val, 0), 6);
  assert.deepStrictEqual(await an().reduce((acc, val) => acc - val, 0), -6);
  // .forEach
  assert.deepStrictEqual(await an().forEach(() => null), undefined);

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
  // .takeWhile
  assert.deepStrictEqual(await atwc().takeWhile(e => e <= 2).toArray(), [1, 2]);
  // .fuse
  assert.deepStrictEqual(await afc().fuse().toArray(), [1, 2, 3]);
  // .partition
  assert.deepStrictEqual(await an().partition(c => c <= 2), [[1, 2], [3]]);
  // .findIndex
  assert.strictEqual(await an().findIndex(e => e === 2), 1);
  // .max
  assert.strictEqual(await an().max(), 3);
  // .min
  assert.strictEqual(await an().min(), 1);

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

