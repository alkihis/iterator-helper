import { HIterator } from './HIterator';

interface IIterFunction {
  // Call prototypes
  /** Create a new `HIterator` instance from an iterator or an iterable. */
  <T, TReturn, TNext>(item: Iterator<T, TReturn, TNext>): HIterator<T, TReturn, TNext>;
  <T>(item: Iterable<T>): HIterator<T>;
  <T, TReturn = any, TNext = undefined>(iterator: Iterator<T, TReturn, TNext> | Iterable<T>): HIterator<T, TReturn, TNext>;

  /** Create a new range `HIterator` from {0} to {stop}, 1 by 1. If {stop} is negative, it goes -1 by -1. */
  range(stop: number): HIterator<number>;
  /** Create a new range `HIterator` from {start} to {stop}, 1 by 1. If {stop} < {start}, it goes -1 by -1. */
  range(start: number, stop: number): HIterator<number>;
  /** Create a new range `HIterator` from {start} to {stop}, adding {step} at each step. */
  range(start: number, stop: number, step: number): HIterator<number>;

  /** Create a new `HIterator` that emit only {item} indefinitively. */
  repeat<I>(item: I): HIterator<I>;
  /** Create a new `HIterator` that emit only {item}, {times} times. */
  repeat<I>(item: I, times: number): HIterator<I>;
}

// Main functiob

export const iter: IIterFunction = function iter<T, TReturn = any, TNext = undefined>(item: Iterator<T, TReturn, TNext> | Iterable<T>) {
  return HIterator.from(item);
};

// STATIC HELPERS - ITERATOR CREATOR

iter.range = (start: number, stop?: number, step?: number) => {
  if (stop === undefined) {
    stop = start;
    start = 0;
    step = step === undefined ? (stop >= 0 ? 1 : -1) : step;
  }
  if (step === undefined) {
    // start and stop are defined
    step = start <= stop ? 1 : -1;
  }

  let current = start, end = stop, toAdd = step;

  return HIterator.from<number>({
    next() {
      const currentValue = current;
      const hasEnded = toAdd < 0 ? currentValue <= end : currentValue >= end;

      if (hasEnded) {
        return { value: undefined, done: true };
      }
      else {
        current += toAdd;
        return { value: currentValue, done: false };
      }
    },
  });
};

iter.repeat = <I>(item: I, times?: number) => {
  let iterations = 0;
  let repetitions = times === undefined ? Infinity : times;

  if (repetitions < 0 || isNaN(repetitions)) {
    throw new RangeError('Invalid times value for repeat iterator.');
  }

  return HIterator.from<I>({
    next() {
      if (iterations < repetitions) {
        iterations++;
        return { value: item, done: false };
      }
      return { value: undefined, done: true };
    },
  });
};
