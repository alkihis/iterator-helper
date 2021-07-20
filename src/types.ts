export const IteratorSlot = Symbol('IteratorSlot');

export type Parameters<T, R> = T extends (... args: infer T) => R ? T : never;
export type IteratorOrIterable<T> = Iterable<T> | Iterator<T>;
export type AsyncIteratorOrIterable<T> = AsyncIterable<T> | AsyncIterator<T>;
