/**
 * This module introduces the List<T> class, an immutable collection designed with a functional programming approach
 * in TypeScript. It's ideal for scenarios where immutability is paramount, providing a rich set of methods for
 * list manipulation and querying without mutating the original data. Recent updates have enhanced the API to return
 * `Option<T>` types for methods where a value might not be present, ensuring even greater type safety and adherence
 * to functional programming principles.
 *
 * Key Features:
 * - Immutability: Ensures safe operations by returning new instances for each operation, leaving the original list untouched.
 * - Comprehensive API: From basic operations like `map` and `filter` to more specialized ones like `compact`, `shuffle`, and `groupBy`, now with `Option<T>` for safer access.
 * - Enhanced Type Safety: Leverages `Option<T>` to explicitly handle the presence or absence of values.
 * - Iterable Compatibility: Conforms to the Iterable protocol, allowing seamless integration with JavaScript's iteration constructs.
 *
 * Usage Examples:
 *
 * Creating and Manipulating Lists:
 * ```typescript
 * const nums = List.of(1, 2, 3, null, 4, undefined, 5);
 * const words = List.of("apple", "banana", "cherry", "date");
 * ```
 *
 * Compact - Remove `null` and `undefined` values:
 * ```typescript
 * const compactedNums = nums.compact(); // [1, 2, 3, 4, 5]
 * ```
 *
 * Shuffle - Randomize the order of elements, demonstrating `Option<T>`:
 * ```typescript
 * const shuffledWords = words.shuffle();
 * const randomWord = shuffledWords.random();
 * console.log(randomWord.isSome() ? randomWord.unwrap() : "List is empty");
 * ```
 *
 * GroupBy - Organize items into groups based on a callback function:
 * ```typescript
 * const groupedByLength = words.groupBy(word => word.length);
 * console.log(groupedByLength); // { '5': ["apple"], '6': ["banana", "cherry"], '4': ["date"] }
 * ```
 *
 * Accessing Elements with `Option<T>`:
 * ```typescript
 * const firstNum = nums.first();
 * console.log(firstNum.isSome() ? `First number: ${firstNum.unwrap()}` : "List is empty");
 *
 * const lastWord = words.last();
 * console.log(lastWord.isSome() ? `Last word: ${lastWord.unwrap()}` : "List is empty");
 * ```
 *
 * Advanced Operations:
 *
 * Zip - Combine two lists into a list of pairs:
 * ```typescript
 * const moreNums = List.of(6, 7, 8);
 * const zippedLists = nums.zip(moreNums);
 * console.log(zippedLists.toArray()); // [[1, 6], [2, 7], [3, 8]]
 * ```
 *
 * Unique & UniqueBy - Deduplicate elements:
 * ```typescript
 * const duplicates = List.of(1, 2, 2, 3, 3, 3);
 * const uniqueNums = duplicates.unique();
 * console.log(uniqueNums.toArray()); // [1, 2, 3]
 *
 * const people = List.of({ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 1, name: "Alice" });
 * const uniquePeople = people.uniqueBy(person => person.id);
 * console.log(uniquePeople.toArray()); // [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
 * ```
 *
 * The `List<T>` class offers a functional, chainable API for elegant and expressive list operations, now enhanced with `Option<T>` for methods that might not always have a return value. It's a powerful tool for developers who prefer immutable data structures and functional programming techniques.
 * @module
 */

import { assert, isDefined, isIterable } from "@oxi/core";
import { Option } from "@oxi/option";

const proto = Array.prototype;

const SUPPORTS_AT = "at" in proto;
const SUPPORTS_CLONE = "structuredClone" in globalThis;
const SUPPORTS_FIND_LAST = "findLast" in proto;
const SUPPORTS_FIND_LAST_INDEX = "findLastIndex" in proto;
const SUPPORTS_REVERSE = "toReversed" in proto;
const SUPPORTS_SORT = "toSorted" in proto;
const SUPPORTS_SPLICE = "toSpliced" in proto;

/**
 * Represents an immutable list of items. The `List` class provides a variety of
 * methods to perform operations on lists such as mapping, filtering, and reducing.
 * This class is designed to offer a functional approach to list manipulation.
 *
 * @template T The type of elements in the list.
 */
export class List<T> implements Iterable<T> {
  #array: ReadonlyArray<T>;

  [Symbol.iterator](): Iterator<T> {
    return this.#array[Symbol.iterator]();
  }

  /**
   * Creates an instance of `List` from a `ReadonlyArray`.
   * This constructor is private and is only meant to be used internally by the class.
   *
   * @param {ReadonlyArray<T>} array The array to create a list from.
   */
  private constructor(array: ReadonlyArray<T>) {
    this.#array = array;
  }

  /**
   * Creates an empty `List`.
   *
   * @template T The type of elements in the list.
   * @return {List<T>} An empty list.
   * @example
   * ```ts
   * const emptyList = List.empty<number>();
   * ```
   */
  static empty<T>(): List<T> {
    return new List([]);
  }

  /**
   * Creates a new `List` instance from a spread of items.
   *
   * @template T The type of elements in the list.
   * @param {...ReadonlyArray<T>} items The items to include in the new list.
   * @return {List<T>} A new list containing the provided items.
   * @example
   * ```ts
   * const numberList = List.of(1, 2, 3);
   * ```
   */
  static of<T>(...items: ReadonlyArray<T>): List<T> {
    return new List(items);
  }

  /**
   * Creates a new `List` from an iterable object or array-like object.
   *
   * @template T The type of elements in the list.
   * @param {Iterable<T> | ArrayLike<T>} iterable The iterable or array-like object to create a list from.
   * @return {List<T>} A new list containing the elements from the iterable or array-like object.
   * @example
   * ```ts
   * const array = [1, 2, 3];
   * const listFromIterable = List.from(array);
   * ```
   */
  static from<T>(iterable: Iterable<T> | ArrayLike<T>): List<T> {
    assert(isIterable(iterable), "'iterable' must be an iterable object.");
    return new List(Array.from(iterable));
  }

  /**
   * Creates a new `List` containing a range of numbers.
   *
   * @param {number} from The start of the range (inclusive).
   * @param {number} to The end of the range (exclusive).
   * @param {number} [step=1] The value to increment by in each step.
   * @return {List<number>} A new list containing the range of numbers.
   * @example
   * ```ts
   * const rangeList = List.range(1, 4); // [1, 2, 3]
   * ```
   */
  static range(from: number, to: number, step: number = 1): List<number> {
    assert(step > 0, "'step' must be a positive number.");
    const result: number[] = [];
    for (let i = from; i < to; i += step) {
      result.push(i);
    }
    return new List(result);
  }

  /**
   * Returns the number of elements in the list.
   *
   * @return {number} The number of elements in the list.
   */
  get size(): number {
    return this.#array.length;
  }

  /**
   * Appends new elements to the end of the list and returns a new `List`.
   *
   * @param {...ReadonlyArray<T>} items The items to append.
   * @return {List<T>} A new list with the appended items.
   * @example
   * ```ts
   * const list = List.of(1, 2);
   * const appendedList = list.append(3, 4); // [1, 2, 3, 4]
   * ```
   */
  append(...items: ReadonlyArray<T>): List<T> {
    return new List([...this.#array, ...items]);
  }

  /**
   * Retrieves the element at the specified index. Negative indices count from the end of the list.
   * Wraps the result in an `Option<T>`, which is `Some<T>` if an element is found, or `None` if the index is out of bounds.
   *
   * @param {number} index The index of the element to retrieve. Supports negative indices.
   * @return {Option<T>} An `Option<T>` containing the element at the specified index or `None` if out of bounds.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const itemOption = list.at(-1); // Some(3)
   * const outOfBoundsOption = list.at(10); // None
   *
   * // Using the Option value
   * if (itemOption.isSome()) {
   *   console.log(itemOption.unwrap()); // 3
   * } else {
   *   console.log("Item not found");
   * }
   *
   * // Providing a default value with the same type
   * console.log(outOfBoundsOption.unwrapOr(0)); // 0
   * ```
   */
  at(index: number): Option<T> {
    if (SUPPORTS_AT) {
      return Option.from(this.#array.at(index));
    }
    if (index < 0) {
      index = this.size + index;
    }
    return Option.from(this.#array[index]);
  }

  /**
   * Splits the list into chunks of the specified size and returns a new list of these chunks.
   *
   * @param {number} size The size of each chunk.
   * @return {List<T[]>} A new list containing chunks of the original list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const chunkedList = list.chunk(2); // [[1, 2], [3, 4]]
   * ```
   */
  chunk(size: number): List<T[]> {
    assert(size > 0, "'size' must be greater than zero.");
    const chunks: T[][] = [];
    for (let i = 0; i < this.size; i += size) {
      chunks.push(this.#array.slice(i, i + size));
    }
    return new List(chunks);
  }

  /**
   * Creates a shallow or deep clone of the list. `structuredClone` must be available in the environment to perform a deep clone.
   *
   * @param {boolean} [deep=false] Specifies if a deep clone should be created.
   * @return {List<T>} A new list that is a clone of the original list.
   * @example
   * ```ts
   * const list = List.of({ id: 1 }, { id: 2 });
   * const shallowClone = list.clone();
   * const deepClone = list.clone(true);
   * ```
   */
  clone(deep?: boolean): List<T> {
    if (deep) {
      assert(
        SUPPORTS_CLONE,
        "Deep cloning is not supported in this environment. To perform a deep clone, ensure 'structuredClone' is available.",
      );
      return new List(structuredClone(this.#array));
    }
    return new List(this.#array.slice());
  }

  /**
   * Filters out `null` and `undefined` values from the list and returns a new list of all truthy values
   * as well as 'falsy' values like 0 (zero), '' (empty string), and `false` that are not `null` or `undefined`.
   *
   * @return {List<NonNullable<T>>} A new list with all non-null and non-undefined values.
   * @example
   * ```ts
   * const list = List.of(0, 1, null, 3, undefined, '');
   * const compactedList = list.compact(); // [0, 1, 3, '']
   * ```
   */
  compact(): List<NonNullable<T>> {
    return this.filter(isDefined);
  }

  /**
   * Maps each item using a callback function and filters out any null or undefined values in the same pass.
   *
   * @template U The type of the elements in the resulting list.
   * @param {(item: T, index: number) => U} callback A function that produces an element of the new list.
   * @return {List<NonNullable<U>>} A new list of non-null and non-undefined values produced by the callback function.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const compactMappedList = list.compactMap((x) => (x > 1 ? x * 2 : null)); // [4, 6]
   * ```
   */
  compactMap<U>(callback: (item: T, index: number) => U): List<NonNullable<U>> {
    assert(typeof callback === "function", "'callback' must be a function.");
    const arr: NonNullable<U>[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = callback(this.#array[i], i);
      if (isDefined(item)) {
        arr.push(item);
      }
    }
    return new List(arr);
  }

  /**
   * Concatenates all the elements in the provided lists into a single list.
   *
   * @param {...ReadonlyArray<Iterable<T>>} items Iterables to concatenate.
   * @return {List<T>} A new list containing elements from this list followed by elements from the provided lists.
   * @example
   * ```ts
   * const list1 = List.of(1, 2);
   * const list2 = List.of(3, 4);
   * const combinedList = list1.concat(list2); // [1, 2, 3, 4]
   * ```
   */
  concat(...items: ReadonlyArray<Iterable<T>>): List<T> {
    const arr = this.#array.slice();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      assert(isIterable(item), "'item' must be iterable.");
      arr.push(...item);
    }
    return new List(arr);
  }

  /**
   * Groups the elements of the list according to a callback function and returns the count of elements in each group.
   *
   * @template K A string key that represents the group.
   * @param {(item: T, index: number) => K} callback A function that assigns an item to a group.
   * @return {Record<K, number>} An object with keys representing groups and values representing the count of elements in each group.
   * @example
   * ```ts
   * const list = List.of({ fruit: 'apple' }, { fruit: 'banana' }, { fruit: 'apple' });
   * const groupedCount = list.countBy((x) => x.fruit); // { apple: 2, banana: 1 }
   * ```
   */
  countBy<K extends string>(
    callback: (item: T, index: number) => K,
  ): Record<K, number> {
    assert(typeof callback === "function", "'callback' must be a function.");
    const obj = Object.create(null) as Record<K, number>;
    for (let i = 0; i < this.size; i++) {
      const key = callback(this.#array[i], i);
      if (!obj[key]) {
        obj[key] = 0;
      }
      obj[key] += 1;
    }
    return obj;
  }

  /**
   * Returns a new list containing only the elements from this list that are not present in the provided list.
   *
   * @param {List<T>} other The list to compare against.
   * @return {List<T>} A new list containing the difference of the two lists.
   * @example
   * ```ts
   * const list1 = List.of(1, 2, 3);
   * const list2 = List.of(3, 4, 5);
   * const differenceList = list1.difference(list2); // [1, 2]
   * ```
   */
  difference(other: List<T>): List<T> {
    assert(other instanceof List, "'other' must be an instance of 'List'.");
    const otherSet = new Set(other.#array);
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.#array[i];
      if (!otherSet.has(item)) {
        result.push(item);
      }
    }
    return new List(result);
  }

  /**
   * Drops the first `count` elements from the list and returns a new list containing the remaining elements.
   *
   * @param {number} count The number of elements to drop from the beginning of the list.
   * @return {List<T>} A new list with the elements after the first `count` elements.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const droppedList = list.drop(2); // [3, 4]
   * ```
   */
  drop(count: number): List<T> {
    assert(count > 0, "'count' must be greater than zero.");
    return this.slice(count);
  }

  /**
   * Drops the first element from the list and returns a new list containing the remaining elements.
   *
   * @returns {List<T>} A new list with the elements after the first element.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const droppedList = list.dropFirst(); // [2, 3, 4]
   * ```
   */
  dropFirst(): List<T> {
    return this.slice(1);
  }

  /**
   * Drops the last element from the list and returns a new list containing the remaining elements.
   *
   * @returns {List<T>} A new list with the elements before the last element.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const droppedList = list.dropLast(); // [1, 2, 3]
   * ```
   */
  dropLast(): List<T> {
    return this.slice(0, -1);
  }

  /**
   * Drops elements from the list as long as the predicate returns true and returns a new list with the remaining elements.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to test each element of the list.
   * @return {List<T>} A new list with the remaining elements after the predicate returns false for the first time.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const droppedList = list.dropWhile(item => item < 3); // [3, 4]
   * ```
   */
  dropWhile(predicate: (item: T, index: number) => boolean): List<T> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    let dropIndex = 0;
    while (
      dropIndex < this.size &&
      predicate(this.#array[dropIndex], dropIndex)
    ) {
      dropIndex++;
    }
    return this.slice(dropIndex);
  }

  /**
   * Performs the specified action for each element in the list.
   *
   * @param {(item: T, index: number) => void} callback A function to execute for each element.
   * @return {List<T>} The original list, allowing method chaining.
   * @example
   * ```ts
   * List.of(1, 2, 3).each(item => console.log(item)); // Logs 1, 2, 3
   * ```
   */
  each(callback: (item: T, index: number) => void): this {
    assert(typeof callback === "function", "'callback' must be a function.");
    this.#array.forEach(callback);
    return this;
  }

  /**
   * Creates a new list containing tuples of each element in the list and its index.
   *
   * @return {List<[number, T]>} A new list containing tuples of [index, element].
   * @example
   * ```ts
   * const list = List.of('a', 'b', 'c');
   * const enumeratedList = list.enumerate(); // [[0, 'a'], [1, 'b'], [2, 'c']]
   * ```
   */
  enumerate(): List<[index: number, item: T]> {
    const arr: [number, T][] = [];
    for (let i = 0; i < this.size; i++) {
      arr.push([i, this.#array[i]]);
    }
    return new List(arr);
  }

  /**
   * Determines whether all elements of the list satisfy the specified condition.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to test each element for a condition.
   * @return {boolean} `true` if every element of the list passes the test implemented by the `predicate`, otherwise `false`.
   * @example
   * ```
   * const allEven = List.of(2, 4, 6).every(item => item % 2 === 0); // true
   * ```
   */
  every(predicate: (item: T, index: number) => boolean): boolean {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    return this.#array.every(predicate);
  }

  filter<U extends T>(
    predicate: (item: T, index: number) => item is U,
  ): List<U>;

  filter(predicate: (item: T, index: number) => boolean): List<T>;

  /**
   * Returns a new list with all elements that pass the test implemented by the provided function.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to test each element of the list.
   * @return {List<T>} A new list with the elements that pass the test.
   * @example
   * ```ts
   * const evens = List.of(1, 2, 3, 4).filter(item => item % 2 === 0); // [2, 4]
   * ```
   */
  filter(predicate: (item: T, index: number) => boolean): List<T> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    return new List(this.#array.filter(predicate));
  }

  /**
   * Finds the first element in the list satisfying a predicate, if any.
   * Wraps the result in an `Option<T>`, which is `Some<T>` if an element is found that satisfies the predicate, or `None` if no such element exists.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to execute on each value in the list.
   * @return {Option<T>} An `Option<T>` containing the first element that satisfies the predicate, or `None` if no such element is found.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   *
   * // Using the Option for a found element
   * const foundOption = list.find(item => item > 1);
   * console.log(foundOption.isSome() ? foundOption.unwrap() : "No match found"); // 2
   *
   * // Using the Option for a not found element
   * const notFoundOption = list.find(item => item > 3);
   * console.log(notFoundOption.isSome() ? notFoundOption.unwrap() : "No match found"); // "No match found"
   * ```
   */
  find(predicate: (item: T, index: number) => boolean): Option<T> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    return Option.from(this.#array.find(predicate));
  }

  /**
   * Finds the index of the first element in the list that satisfies the provided testing function.
   * Wraps the result in an `Option<number>`, which is `Some<number>` if an element satisfying the predicate is found,
   * or `None` if no such element exists.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to execute on each value in the list.
   * @return {Option<number>} An `Option<number>` containing the index of the first element that passes the test,
   * or `None` if no element satisfies the predicate.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   *
   * // Using the Option for a found index
   * const indexOption = list.findIndex(item => item > 1);
   * console.log(indexOption.isSome() ? `Found at index: ${indexOption.unwrap()}` : "No match found"); // Found at index: 1
   *
   * // Using the Option for a not found index
   * const notFoundOption = list.findIndex(item => item > 3);
   * console.log(notFoundOption.isSome() ? `Found at index: ${notFoundOption.unwrap()}` : "No match found"); // No match found
   * ```
   */
  findIndex(
    predicate: (item: T, index: number) => boolean,
  ): Option<number> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    const index = this.#array.findIndex(predicate);
    if (index < 0) {
      return Option.None;
    }
    return Option.Some(index);
  }

  /**
   * Finds the last element in the list satisfying a predicate, if any.
   * Wraps the result in an `Option<T>`, which is `Some<T>` if an element is found that satisfies the predicate from the end of the list,
   * or `None` if no such element exists.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to execute on each value in the list, from last to first.
   * @return {Option<T>} An `Option<T>` containing the last element that satisfies the predicate, or `None` if no such element is found.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 2);
   *
   * // Using the Option for a found element
   * const foundOption = list.findLast(item => item > 1);
   * console.log(foundOption.isSome() ? foundOption.unwrap() : "No match found"); // 2
   *
   * // Using the Option for a not found element
   * const notFoundOption = list.findLast(item => item > 3);
   * console.log(notFoundOption.isSome() ? foundOption.unwrap() : "No match found"); // "No match found"
   * ```
   */
  findLast(predicate: (item: T, index: number) => boolean): Option<T> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    if (SUPPORTS_FIND_LAST) {
      return Option.from(this.#array.findLast(predicate));
    }
    for (let i = this.size - 1; i >= 0; i--) {
      const item = this.#array[i];
      if (predicate(item, i)) {
        return Option.Some(item);
      }
    }
    return Option.None;
  }

  /**
   * Finds the index of the last element in the list that satisfies the provided testing function.
   * Wraps the result in an `Option<number>`, which is `Some<number>` if an index is found that satisfies the predicate from the end of the list,
   * or `None` if no such index exists.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to execute on each value in the list, from last to first.
   * @return {Option<number>} An `Option<number>` containing the index of the last element that passes the test,
   * or `None` if no element satisfies the predicate.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 2);
   *
   * // Using the Option for a found index
   * const indexOption = list.findLastIndex(item => item > 1);
   * console.log(indexOption.isSome() ? `Found at index: ${indexOption.unwrap()}` : "No match found"); // Found at index: 3
   *
   * // Using the Option for a not found index
   * const notFoundOption = list.findLastIndex(item => item > 3);
   * console.log(notFoundOption.isSome() ? `Found at index: ${notFoundOption.unwrap()}` : "No match found"); // "No match found"
   * ```
   */
  findLastIndex(
    predicate: (item: T, index: number) => boolean,
  ): Option<number> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    if (SUPPORTS_FIND_LAST_INDEX) {
      const index = this.#array.findLastIndex(predicate);
      if (index < 0) {
        return Option.None;
      }
      return Option.Some(index);
    }
    for (let i = this.size - 1; i >= 0; i--) {
      const item = this.#array[i];
      if (predicate(item, i)) {
        return Option.Some(i);
      }
    }
    return Option.None;
  }

  /**
   * Returns the first element of the list wrapped in an `Option<T>`. If the list is empty, it returns `None`.
   *
   * @return {Option<T>} An `Option<T>` containing the first element of the list if the list is not empty, or `None` if the list is empty.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   *
   * // Using the Option for the first element
   * const firstOption = list.first();
   * console.log(firstOption.isSome() ? firstOption.unwrap() : "List is empty"); // 1
   *
   * // Using the Option for an empty list
   * const emptyList = List.empty<number>();
   * const emptyOption = emptyList.first();
   * console.log(emptyOption.isSome() ? emptyOption.unwrap() : "List is empty"); // "List is empty"
   * ```
   */
  first(): Option<T> {
    return this.at(0);
  }

  /**
   * Flattens the list up to a specified depth and returns a new list.
   *
   * @template D The maximum depth to flatten.
   * @param {number} [depth=1] The depth level specifying how deep a nested array structure should be flattened.
   * @return {List<FlatArray<T[], D>>} A new list with the sub-array elements concatenated into it recursively up to the specified depth.
   * @example
   * ```ts
   * const list = List.of([1, 2], [3, [4, 5]]);
   * const flatList = list.flat(); // [1, 2, 3, [4, 5]]
   * ```
   */
  flat<D extends number>(depth?: D): List<FlatArray<T[], D>> {
    return new List(this.#array.slice().flat(depth));
  }

  /**
   * Maps each element using a callback function and flattens the result into a new list.
   *
   * @template U The type of the elements in the new list.
   * @param {(item: T, index: number) => U | ReadonlyArray<U>} callback A function that produces an element of the new list, flattening the result.
   * @return {List<U>} A new list with each element being the result of the callback function and flattened to a depth of 1.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const flatMapList = list.flatMap(item => [item, item * 2]); // [1, 2, 2, 4, 3, 6]
   * ```
   */
  flatMap<U>(
    callback: (item: T, index: number) => U | ReadonlyArray<U>,
  ): List<U> {
    assert(typeof callback === "function", "'callback' must be a function.");
    return new List(this.#array.flatMap(callback));
  }

  /**
   * Groups the elements of the list according to a callback function and returns an object.
   *
   * @template K A string key that represents the group.
   * @param {(item: T, index: number) => K} callback A function that assigns an item to a group.
   * @return {Record<K, T[]>} An object with keys representing groups and values being arrays of elements in those groups.
   * @example
   * ```ts
   * const list = List.of({ fruit: 'apple' }, { fruit: 'banana' }, { fruit: 'apple' });
   * const grouped = list.groupBy((x) => x.fruit); // { apple: [{ fruit: 'apple' }, { fruit: 'apple' }], banana: [{ fruit: 'banana' }] }
   * ```
   */
  groupBy<K extends string>(
    callback: (item: T, index: number) => K,
  ): Record<K, T[]> {
    assert(typeof callback === "function", "'callback' must be a function.");
    const group = Object.create(null) as Record<K, T[]>;
    for (let i = 0; i < this.size; i++) {
      const item = this.#array[i];
      const key = callback(item, i);
      assert(typeof key === "string", "'callback' must return a string.");
      if (!group[key]) {
        group[key] = [];
      }
      group[key].push(item);
    }
    return group;
  }

  /**
   * Checks if the list contains a specific element.
   *
   * @param {T} item The element to search for in the list.
   * @return {boolean} `true` if the list contains the specified element, otherwise `false`.
   * @example
   * ```ts
   * const contains = List.of(1, 2, 3).has(2); // true
   * const notContains = List.of(1, 2, 3).has(4); // false
   * ```
   */
  has(item: T): boolean {
    return this.#array.includes(item);
  }

  /**
   * Inserts an item at the specified index and returns a new list. Negative indices count from the end of the list.
   *
   * @param {number} index The index at which to insert the item.
   * @param {T} item The item to insert.
   * @return {List<T>} A new list with the item inserted at the specified index.
   * @example
   * ```ts
   * const list = List.of(1, 3);
   * const updatedList = list.insertAt(1, 2); // [1, 2, 3]
   * ```
   */
  insertAt(index: number, item: T): List<T> {
    return this.splice(index, 0, item);
  }

  /**
   * Creates a new list that is the intersection of the current list and another list.
   *
   * @param {List<T>} other The other list to intersect with.
   * @return {List<T>} A new list containing elements found in both lists.
   * @example
   * ```ts
   * const list1 = List.of(1, 2, 3);
   * const list2 = List.of(2, 3, 4);
   * const intersectionList = list1.intersection(list2); // [2, 3]
   * ```ts
   */
  intersection(other: List<T>): List<T> {
    assert(other instanceof List, "'other' must be an instance of 'List'.");
    const otherSet = new Set(other.#array);
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.#array[i];
      if (otherSet.has(item)) {
        result.push(item);
        otherSet.delete(item);
      }
    }
    return new List(result);
  }

  /**
   * Checks if the list is empty.
   *
   * @return {boolean} `true` if the list contains no elements, otherwise `false`.
   * @example
   * ```ts
   * const isEmpty = List.empty().isEmpty(); // true
   * const isNotEmpty = List.of(1, 2, 3).isEmpty(); // false
   * ```
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Checks if the list is not empty.
   *
   * @return {boolean} `true` if the list contains one or more elements, otherwise `false`.
   * @example
   * ```ts
   * const isNotEmpty = List.of(1).isNotEmpty(); // true
   * const isEmpty = List.empty().isNotEmpty(); // false
   * ```
   */
  isNotEmpty(): boolean {
    return this.size > 0;
  }

  /**
   * Returns the last element of the list wrapped in an `Option<T>`. If the list is empty, it returns `None`.
   *
   * @return {Option<T>} An `Option<T>` containing the last element of the list if the list is not empty, or `None` if the list is empty.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   *
   * // Using the Option for the last element
   * const lastOption = list.last();
   * console.log(lastOption.isSome() ? lastOption.unwrap() : "List is empty"); // 3
   *
   * // Using the Option for an empty list
   * const emptyList = List.empty<number>();
   * const emptyOption = emptyList.last();
   * console.log(emptyOption.isSome() ? emptyOption.unwrap() : "List is empty"); // "List is empty"
   * ```
   */
  last(): Option<T> {
    return this.at(-1);
  }

  /**
   * Maps each element in the list using a transformation function and returns a new list of the transformed elements.
   *
   * @template U The type of the elements in the new list.
   * @param {(item: T, index: number) => U} callback A function that transforms each element of the list.
   * @return {List<U>} A new list containing the elements resulting from the transformation function.
   * @example
   * ```ts
   * const doubled = List.of(1, 2, 3).map(item => item * 2); // [2, 4, 6]
   * ```
   */
  map<U>(callback: (item: T, index: number) => U): List<U> {
    assert(typeof callback === "function", "'callback' must be a function.");
    return new List(this.#array.map(callback));
  }

  /**
   * Moves an element from one position to another within the list and returns a new list. Negative indices count from the end of the list.
   *
   * @param {number} src The index of the element to move.
   * @param {number} dst The index where the element is to be moved.
   * @return {List<T>} A new list with the element moved to the new position.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const movedList = list.move(0, 2); // [2, 3, 1]
   * ```
   */
  move(src: number, dst: number): List<T> {
    if (src < 0) {
      src = this.size + src;
    }
    if (dst < 0) {
      dst = this.size + src;
    }
    if (src < 0 || src >= this.size || dst < 0 || dst >= this.size) {
      return this.slice();
    }
    const arr = this.#array.slice();
    const [itemToMove] = arr.splice(src, 1);
    arr.splice(dst, 0, itemToMove);
    return new List(arr);
  }

  /**
   * Partitions the elements of the list into two groups based on a type-guard predicate.
   * The first group contains all elements for which the predicate returns true (of type U),
   * and the second group contains all the elements for which it returns false (type Exclude<T, U>).
   *
   * @template T The base type of elements in the list.
   * @template U The subset of T that matches the predicate.
   *
   * @param { (item: T, index: number) => item is U } predicate - A type-guard predicate function to test each element of the list.
   *    The function should return `true` for elements to be included in the first group, and `false` for those to be included in the second.
   * @returns {[List<U>, List<Exclude<T, U>>]} A tuple containing two lists:
   *    the first with elements that satisfy the type-guard predicate, and the second with those that do not.
   *
   * @example
   * ```ts
   * // Assuming ListItemType is the base type and MatchedListItemType is a subtype of ListItemType
   * const myList = List.of(...);
   * const [matched, notMatched] = myList.partition((item, index) => item instanceof MatchedListItemType);
   * ```
   * @since 1.1.0
   */
  partition<U extends T>(
    predicate: (item: T, index: number) => item is U,
  ): [List<U>, List<Exclude<T, U>>];

  /**
   * Partitions the elements of the list into two groups based on a boolean-returning predicate.
   * The first group contains all elements for which the predicate returns true,
   * and the second group contains all the elements for which it returns false.
   *
   * @template T The type of elements in the list.
   *
   * @param { (item: T, index: number) => boolean } predicate - A predicate function to test each element of the list.
   *    The function should return `true` for elements to be included in the first group, and `false` for those to be included in the second.
   * @returns {[List<T>, List<T>]} A tuple containing two lists of the same type `T`:
   *    the first with elements that satisfy the predicate, and the second with those that do not.
   *
   * @example
   * ```ts
   * const myList = List.of(...)
   * const [truthyItems, falsyItems] = myList.partition((item, index) => Boolean(item));
   * ```
   * @since 1.1.0
   */
  partition(
    predicate: (item: T, index: number) => boolean,
  ): [List<T>, List<T>];

  partition(
    predicate: (item: T, index: number) => boolean,
  ): [List<T>, List<T>] {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    const matched: T[] = [];
    const unmatched: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.#array[i];
      if (predicate(item, i)) {
        matched.push(item);
      } else {
        unmatched.push(item);
      }
    }
    return [new List(matched), new List(unmatched)];
  }

  /**
   * Adds new elements to the beginning of the list and returns a new list.
   *
   * @param {...ReadonlyArray<T>} items The items to prepend to the list.
   * @return {List<T>} A new list with the items added to the beginning.
   * @example
   * ```ts
   * const list = List.of(2, 3);
   * const prependedList = list.prepend(1); // [1, 2, 3]
   * ```
   */
  prepend(...items: ReadonlyArray<T>): List<T> {
    return new List([...items, ...this.#array]);
  }

  /**
   * Returns a random element from the list wrapped in an `Option<T>`. If the list is empty, it returns `None`.
   *
   * This method selects a random element using a uniform distribution, meaning each element has an equal chance of being selected.
   *
   * @return {Option<T>} An `Option<T>` containing a random element from the list if the list is not empty, or `None` if the list is empty.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   *
   * // Using the Option for a random element
   * const randomOption = list.random();
   * console.log(randomOption.isSome() ? `Random element: ${randomOption.unwrap()}` : "List is empty");
   * // Outputs: "Random element: 2" (the actual number may vary)
   *
   * // Using the Option for an empty list
   * const emptyList = List.empty<number>();
   * const emptyOption = emptyList.random();
   * console.log(emptyOption.isSome() ? `Random element: ${emptyOption.unwrap()}` : "List is empty"); // "List is empty"
   * ```
   */
  random(): Option<T> {
    const randomIndex = Math.floor(Math.random() * this.size);
    return this.at(randomIndex);
  }

  /**
   * Reduces the list to a single value using a reducer function and an initial accumulator value.
   *
   * @template U The type of the accumulated value.
   * @param {U} initialValue The initial accumulator value.
   * @param {(accumulator: U, current: T) => U} callback A reducer function to apply to each element.
   * @return {U} The accumulated value.
   * @example
   * ```ts
   * const sum = List.of(1, 2, 3).reduce(0, (acc, current) => acc + current); // 6
   * ```
   */
  reduce<U>(initialValue: U, callback: (accumulator: U, current: T) => U): U {
    assert(typeof callback === "function", "'callback' must be a function.");
    return this.#array.reduce(callback, initialValue);
  }

  /**
   * Reduces the list to a single value using a reducer function and an initial accumulator value, starting from the right.
   *
   * @template U The type of the accumulated value.
   * @param {U} initialValue The initial accumulator value.
   * @param {(accumulator: U, current: T) => U} callback A reducer function to apply to each element.
   * @return {U} The accumulated value.
   * @example
   * ```ts
   * const sum = List.of(1, 2, 3).reduceRight(0, (acc, current) => acc + current); // 6
   * ```
   */
  reduceRight<U>(
    initialValue: U,
    callback: (accumulator: U, current: T) => U,
  ): U {
    assert(typeof callback === "function", "'callback' must be a function.");
    return this.#array.reduceRight(callback, initialValue);
  }

  /**
   * Removes the element at the specified index and returns a new list. Negative indices count from the end of the list.
   *
   * @param {number} index The index of the element to remove.
   * @return {List<T>} A new list with the element at the specified index removed.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const updatedList = list.removeAt(1); // [1, 3]
   * ```
   */
  removeAt(index: number): List<T> {
    return this.splice(index, 1);
  }

  /**
   * Replaces the element at the specified index with a new value and returns a new list. Negative indices count from the end of the list.
   *
   * @param {number} index The index of the element to replace.
   * @param {T} item The new item to replace the existing element.
   * @return {List<T>} A new list with the element at the specified index replaced.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const updatedList = list.replaceAt(1, 4); // [1, 4, 3]
   * ```
   */
  replaceAt(index: number, item: T): List<T> {
    return this.splice(index, 1, item);
  }

  /**
   * Reverses the order of the elements in the list and returns a new list.
   *
   * @return {List<T>} A new list with the order of elements reversed.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const reversedList = list.reverse(); // [3, 2, 1]
   * ```
   */
  reverse(): List<T> {
    if (SUPPORTS_REVERSE) {
      return new List(this.#array.toReversed());
    }
    return new List(this.#array.slice().reverse());
  }

  /**
   * Rotates the elements of the List by the specified number of positions.
   * Positive values rotate to the right, negative values rotate to the left.
   *
   * @param {number} count The number of positions to rotate the elements. Positive values rotate to the right, negative values rotate to the left.
   * @returns {List<T>} A new List with the elements rotated.
   * @since 1.1.0
   */
  rotate(count: number): List<T> {
    const length = this.#array.length;
    if (length === 0) {
      return this;
    }

    const normalizedCount = count % length;

    if (normalizedCount < 0) {
      return new List([
        ...this.#array.slice(-normalizedCount),
        ...this.#array.slice(0, -normalizedCount),
      ]);
    }

    if (normalizedCount > 0) {
      return new List([
        ...this.#array.slice(length - normalizedCount),
        ...this.#array.slice(0, length - normalizedCount),
      ]);
    }

    return this.slice();
  }

  /**
   * Randomly shuffles the elements of the list a specified number of times and returns a new list.
   * If no number of permutations is specified, the list will be shuffled once by default.
   *
   * @param {number} [permutations=1] The number of times the list should be shuffled.
   * @return {List<T>} A new list with the elements shuffled.
   * @example
   * const list = List.of(1, 2, 3);
   * const shuffledList = list.shuffle(); // Shuffles once by default
   * const moreShuffledList = list.shuffle(5); // Shuffles five times for further randomization
   */
  shuffle(permutations: number = 1): List<T> {
    const shuffledList = this.#array.slice();
    for (let p = 0; p < permutations; p++) {
      for (let i = shuffledList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
      }
    }
    return new List(shuffledList);
  }

  /**
   * Creates a slice of the list from `start` up to, but not including, `end` and returns a new list.
   *
   * @param {number} [start=0] The start position.
   * @param {number} [end=list.size] The end position.
   * @return {List<T>} A new list containing the elements from `start` to `end`.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const slicedList = list.slice(1, 3); // [2, 3]
   * ```
   */
  slice(start?: number, end?: number): List<T> {
    return new List(this.#array.slice(start, end));
  }

  /**
   * Checks if at least one element in the list passes the test implemented by the provided function.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to test each element.
   * @return {boolean} `true` if at least one element passes the test, otherwise `false`.
   * @example
   * ```ts
   * const hasEven = List.of(1, 2, 3).some(item => item % 2 === 0); // true
   * ```
   */
  some(predicate: (item: T, index: number) => boolean): boolean {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    return this.#array.some(predicate);
  }

  /**
   * Sorts the elements of the list according to the order specified by the compare function and returns a new list.
   *
   * @param {(a: T, b: T) => number} [compareFn] The function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
   * @return {List<T>} A new list with the elements sorted.
   * @example
   * ```ts
   * const list = List.of(3, 1, 2);
   * const sortedList = list.sort((a, b) => a - b); // [1, 2, 3]
   * ```
   */
  sort(compareFn?: (a: T, b: T) => number): List<T> {
    if (SUPPORTS_SORT) {
      return new List(this.#array.toSorted(compareFn));
    }
    return new List(this.#array.slice().sort(compareFn));
  }

  splice(start: number, deleteCount?: number | undefined): List<T>;
  splice(
    start: number,
    deleteCount: number,
    ...items: ReadonlyArray<T>
  ): List<T>;

  /**
   * Changes the contents of the list by removing or replacing existing elements and/or adding new elements and returns a new list.
   *
   * @param {number} start The zero-based location in the list at which to start changing the array.
   * @param {number} [deleteCount] An integer indicating the number of elements in the array to remove from start.
   * @param {...ReadonlyArray<T>} items The elements to add to the list, beginning at the start position.
   * @return {List<T>} A new list with the changes applied.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const splicedList = list.splice(1, 2, 5, 6); // [1, 5, 6, 4]
   * ```
   */
  splice(
    start: number,
    deleteCount: number = 0,
    ...items: ReadonlyArray<T>
  ): List<T> {
    if (SUPPORTS_SPLICE) {
      return new List(this.#array.toSpliced(start, deleteCount, ...items));
    }
    const arr = this.#array.slice();
    arr.splice(start, deleteCount, ...items);
    return new List(arr);
  }

  /**
   * Swaps two elements in the list by their indexes and returns a new list.
   *
   * @param {number} aIndex The index of the first element to swap.
   * @param {number} bIndex The index of the second element to swap.
   * @return {List<T>} A new list with the two elements swapped.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const swappedList = list.swap(0, 2); // [3, 2, 1]
   * ```
   */
  swap(aIndex: number, bIndex: number): List<T> {
    if (aIndex < 0) {
      aIndex = this.size + aIndex;
    }
    if (bIndex < 0) {
      bIndex = this.size + bIndex;
    }
    if (
      aIndex < 0 ||
      aIndex >= this.size ||
      bIndex < 0 ||
      bIndex >= this.size
    ) {
      return this.slice();
    }
    const arr = this.#array.slice();
    [arr[aIndex], arr[bIndex]] = [arr[bIndex], arr[aIndex]];
    return new List(arr);
  }

  /**
   * Returns a new list containing the first `count` elements from the list.
   *
   * @param {number} count The number of elements to take from the beginning of the list.
   * @return {List<T>} A new list containing the first `count` elements from the original list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const takenList = list.take(2); // [1, 2]
   * ```
   */
  take(count: number): List<T> {
    assert(count > 0, "'count' must be greater than zero.");
    return this.slice(0, count);
  }

  /**
   * Returns a new list with elements taken from the beginning as long as the predicate returns true.
   *
   * @param {(item: T, index: number) => boolean} predicate A function to test each element.
   * @return {List<T>} A new list with elements taken from the beginning until the predicate returns false.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3, 4);
   * const takenList = list.takeWhile(item => item < 3); // [1, 2]
   * ```
   */
  takeWhile(predicate: (item: T, index: number) => boolean): List<T> {
    assert(typeof predicate === "function", "'predicate' must be a function.");
    let takeIndex = 0;
    while (
      takeIndex < this.size &&
      predicate(this.#array[takeIndex], takeIndex)
    ) {
      takeIndex++;
    }
    return this.take(takeIndex);
  }

  /**
   * Converts the list into a standard JavaScript array.
   *
   * @return {T[]} An array containing all elements of the list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const array = list.toArray(); // [1, 2, 3]
   * ```
   */
  toArray(): T[] {
    return Array.from(this);
  }

  /**
   * Converts the list into a JSON string representation. This method is used by `JSON.stringify`.
   *
   * @return {string} A JSON string representing the list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const jsonString = list.toJSON(); // '[1,2,3]'
   * ```
   */
  toJSON(): T[] {
    return this.toArray();
  }

  /**
   * Converts the list into a standard JavaScript set.
   *
   * @returns {Set<T>} A new set containing all elements of the list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const set = list.toSet(); // Set { 1, 2, 3 }
   * ```
   */
  toSet(): Set<T> {
    return new Set(this.#array);
  }

  /**
   * Returns a string representing the list and its elements.
   *
   * @return {string} A string representing the list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 3);
   * const str = list.toString(); // '1,2,3'
   * ```
   */
  toString(): string {
    return this.toArray().toString();
  }

  /**
   * Creates a new list that is the union of the current list and another list, excluding duplicate elements.
   *
   * @param {List<T>} other The other list to form a union with.
   * @return {List<T>} A new list containing elements from both lists, excluding duplicates.
   * @example
   * ```ts
   * const list1 = List.of(1, 2);
   * const list2 = List.of(2, 3);
   * const unionList = list1.union(list2); // [1, 2, 3]
   * ```
   */
  union(other: List<T>): List<T> {
    assert(other instanceof List, "'other' must be an instance of 'List'.");
    return this.concat(other).unique();
  }

  /**
   * Returns a new list with all duplicate elements removed.
   *
   * @return {List<T>} A new list with only unique elements from the original list.
   * @example
   * ```ts
   * const list = List.of(1, 2, 2, 3);
   * const uniqueList = list.unique(); // [1, 2, 3]
   * ```
   */
  unique(): List<T> {
    return List.from(new Set(this));
  }

  /**
   * Returns a new list with all duplicate elements removed, based on the result of the callback function.
   *
   * @template K The type of the key to unique by, must be property key of T.
   * @param {(item: T, index: number) => K} callback A function that produces a key for each element to unique by.
   * @return {List<T>} A new list with only unique elements based on the callback function.
   * @example
   * ```ts
   * const list = List.of({id: 1, value: 10}, {id: 2, value: 10}, {id: 1, value: 20});
   * const uniqueList = list.uniqueBy(item => item.id); // [{id: 1, value: 10}, {id: 2, value: 10}]
   * ```
   */
  uniqueBy<K extends string | number>(
    callback: (item: T, index: number) => K,
  ): List<T> {
    assert(typeof callback === "function", "'callback' must be a function.");
    const keySet = new Set<K>();
    const uniqueItems = this.#array.filter((item, index) => {
      const key = callback(item, index);
      if (keySet.has(key)) return false;
      keySet.add(key);
      return true;
    });
    return new List(uniqueItems);
  }

  /**
   * Updates the element at the specified index using a callback function and returns a new list.
   *
   * @param {number} index The index of the element to update.
   * @param {(item: T, index: number) => T} callback A function that produces a new value for the element at the specified index.
   * @return {List<T>} A new list with the element at the specified index updated.
   * @example
   * ```ts
   * const list = List.of({ id: 1, user: 'John' }, { id: 2, user: 'Doe' });
   * const updatedList = list.updateAt(1, (item) => ({
   *   ...item,
   *   user: 'Jane'
   * })); // [{ id: 1, user: 'John' }, { id: 2, user: 'Jane' }]
   * ```
   */
  updateAt(index: number, callback: (item: T, index: number) => T): List<T> {
    assert(typeof callback === "function", "'callback' must be a function.");
    if (index < 0) {
      index = this.size + index;
    }
    if (index < 0 || index >= this.size) {
      return this.slice();
    }
    const arr = this.#array.slice();
    arr[index] = callback(arr[index], index);
    return new List(arr);
  }

  /**
   * Combines two lists by pairing up their elements and returns a new list containing pairs.
   *
   * @template U The type of elements in the other list.
   * @param {List<U>} other The other list to zip with.
   * @return {List<[T, U]>} A new list containing pairs of elements, one from each list.
   * @example
   * ```ts
   * const list1 = List.of(1, 2);
   * const list2 = List.of('a', 'b');
   * const zippedList = list1.zip(list2); // [[1, 'a'], [2, 'b']]
   * ```
   */
  zip<U>(other: List<U>): List<[T, U]> {
    assert(other instanceof List, "'other' must be an instance of 'List'.");
    const minLength = Math.min(this.size, other.size);
    const zippedList: [T, U][] = [];
    for (let i = 0; i < minLength; i++) {
      zippedList.push([this.#array[i], other.#array[i]]);
    }
    return new List(zippedList);
  }
}
