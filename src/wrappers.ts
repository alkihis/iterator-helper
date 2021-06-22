import { iter } from './iterator';
import { aiter } from './async-iterator';
import { Parameters } from './types';

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
