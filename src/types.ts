export const IteratorSlot = Symbol('IteratorSlot');

export type Parameters<T, R> = T extends (... args: infer T) => R ? T : never;
export type IteratorOrIterable<T> = IterableIterator<T> | Iterator<T>;
export type AsyncIteratorOrIterable<T> = AsyncIterableIterator<T> | AsyncIterator<T>;
