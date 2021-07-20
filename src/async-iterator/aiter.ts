import { HAsyncIterator } from './HAsyncIterator';

export function aiter<T, TReturn, TNext>(item: AsyncIterator<T, TReturn, TNext>): HAsyncIterator<T, TReturn, TNext>;
export function aiter<T>(item: AsyncIterable<T>): HAsyncIterator<T>;
export function aiter<T, TReturn = any, TNext = undefined>(iterator: AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>): HAsyncIterator<T, TReturn, TNext>;
export function aiter<T, TReturn = any, TNext = undefined>(item: AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>) {
  return HAsyncIterator.from(item);
}
