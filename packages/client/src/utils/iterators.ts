/**
 * Turn an array into an iterator. NOTE: an iterator can only be iterated once.
 * @param array Array to be turned into an iterator
 * @returns Iterator to iterate through the array
 */
export const arrayToIterator = <T>(array: T[]): IterableIterator<T> => {
  let i = 0;
  const iterator: Iterator<T> = {
    next() {
      const done = i >= array.length;
      if (done) return { done, value: null };
      return { value: array[i++] };
    },
  };
  return makeIterable(iterator);
};

/**
 * Concatenate two iterators into a single iterator.
 * @param a First iterator
 * @param b Second iterator
 * @returns Concatenated iterator
 */
export const concatIterators = <T>(a: Iterator<T>, b?: Iterator<T>): IterableIterator<T> => {
  if (!b) return makeIterable(a);
  const iterator: Iterator<T> = {
    next() {
      const next = a.next();
      if (!next.done) return next;
      return b.next();
    },
  };
  return makeIterable(iterator);
};

/**
 * Merge two iterators into a single iterator.
 * @param a First iterator
 * @param b Second iterator
 * @returns Merged iterator
 */
export const mergeIterators = <A, B>(a: Iterator<A>, b: Iterator<B>): IterableIterator<[A, B]> => {
  const iterator: Iterator<[A, B]> = {
    next() {
      const nextA = a.next();
      const nextB = b.next();
      if (nextA.done && nextB.done) return { done: true, value: null };
      return { value: [nextA.value, nextB.value] };
    },
  };
  return makeIterable(iterator);
};

/**
 * Transform an iterator by applying a function to each value.
 * @param iterator Iterator to transform
 * @param transform Function to apply to each value
 */
export const transformIterator = <A, B>(
  iterator: Iterator<A>,
  transform: (value: A) => B
): IterableIterator<B> => {
  return makeIterable({
    next() {
      const { done, value } = iterator.next();
      return { done, value: done ? value : transform(value) };
    },
  });
};

/**
 * Make an iterator iterable.
 * @param iterator Iterator to make iterable
 * @returns Iterable iterator
 */
const makeIterable = <T>(iterator: Iterator<T>): IterableIterator<T> => {
  const iterable: IterableIterator<T> = {
    ...iterator,
    [Symbol.iterator]() {
      return this;
    },
  };

  return iterable;
};
