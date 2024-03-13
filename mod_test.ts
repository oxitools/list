import { isDefined } from "@oxi/core";
import { Option } from "@oxi/option";
import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
} from "https://deno.land/std@0.212.0/assert/mod.ts";
import { List } from "./mod.ts";

function assertSome<T>(
  option: Option<T>,
  value?: T,
): asserts option is Option<T> {
  assert(option.isSome(), "expected Some, got None");
  if (isDefined(value)) {
    assertEquals(option.unwrap(), value);
  }
}

function assertNone<T>(option: Option<T>): asserts option is Option<T> {
  assertFalse(option.isSome(), "expected None, got Some");
}

Deno.test("List#empty", () => {
  const list = List.empty<number>();
  assertEquals([...list], []);
});

Deno.test("List#of", () => {
  const list = List.of(1, 2, 3);
  assertEquals([...list], [1, 2, 3]);
});

Deno.test("List#from", () => {
  let list = List.from([1, 2, 3]);
  assertEquals([...list], [1, 2, 3]);
  list = List.from(new Set([1, 2, 3]));
  assertEquals([...list], [1, 2, 3]);
});

Deno.test("List#range", () => {
  let list = List.range(1, 4);
  assertEquals([...list], [1, 2, 3]);
  list = List.range(1, 4, 2);
  assertEquals([...list], [1, 3]);
});

Deno.test("List.size", () => {
  const list = List.of(1, 2, 3);
  assertEquals(list.size, 3);
});

Deno.test("List.append", () => {
  const list = List.of(1, 2, 3);
  assertEquals([...list.append(4, 5)], [1, 2, 3, 4, 5]);
});

Deno.test("List.at", () => {
  const list = List.of(1, 2, 3);
  assertSome(list.at(1), 2);
  assertNone(list.at(3));
});

Deno.test("List.clone (shallow)", () => {
  const item = { a: 1 };
  const list = List.of(item);
  const clone = list.clone();
  assert(Object.is(clone.at(0).unwrap(), item));
});

Deno.test("List.clone (deep)", () => {
  const item = { a: 1 };
  const list = List.of(item);
  const clone = list.clone(true);
  assert(!Object.is(clone.at(0), item));
  assertSome(clone.at(0), item);
});

Deno.test("List.compact", () => {
  const list = List.of(1, 2, 3, undefined, 4);
  assertEquals([...list.compact()], [1, 2, 3, 4]);
});

Deno.test("List.compactMap", () => {
  const list = List.of(1, 2, 3, 4);
  const result = list.compactMap((x) => (x % 2 === 0 ? x : undefined));
  assertEquals([...result], [2, 4]);
});

Deno.test("List.concat", () => {
  const list = List.of(1, 2, 3);
  const result = list.concat(List.of(4, 5), new Set([6, 7]), [8, 9]);
  assertEquals([...result], [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

Deno.test("List.countBy", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.countBy((x) => (x % 2 === 0 ? "even" : "odd"));
  assertEquals(result, { odd: 3, even: 2 });
});

Deno.test("List.difference", () => {
  const list1 = List.of(1, 2, 3, 4, 5);
  const list2 = List.of(3, 4, 5, 6, 7);
  const result = list1.difference(list2);
  assertEquals([...result], [1, 2]);
});

Deno.test("List.drop", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.drop(2);
  assertEquals([...result], [3, 4, 5]);
});

Deno.test("List.dropFirst", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.dropFirst();
  assertEquals([...result], [2, 3, 4, 5]);
});

Deno.test("List.dropLast", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.dropLast();
  assertEquals([...result], [1, 2, 3, 4]);
});

Deno.test("List.dropWhile", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.dropWhile((x) => x < 3);
  assertEquals([...result], [3, 4, 5]);
});

Deno.test("List.each", () => {
  const list = List.of(1, 2, 3);
  let result = 0;
  list.each((x) => (result += x));
  assertEquals(result, 6);
});

Deno.test("List.enumerate", () => {
  const list = List.of(1, 2, 3);
  const result = list.enumerate();
  assertEquals(
    [...result],
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  );
});

Deno.test("List.every", () => {
  const list = List.of(1, 2, 3);
  const result = list.every((x) => x > 0);
  assert(result);
});

Deno.test("List.filter", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.filter((x) => x % 2 === 0);
  assertEquals([...result], [2, 4]);
});

Deno.test("List.find", () => {
  const list = List.of(1, 2, 3, 4, 5);
  let result = list.find((x) => x % 2 === 0);
  assertSome(result, 2);

  result = list.find((x) => x === 6);
  assertNone(result);
});

Deno.test("List.findIndex", () => {
  const list = List.of(1, 2, 3, 4, 5);
  let result = list.findIndex((x) => x % 2 === 0);
  assertSome(result, 1);

  result = list.findIndex((x) => x === 6);
  assertNone(result);
});

Deno.test("List.findLast", () => {
  const list = List.of(1, 2, 3, 4, 5);
  let result = list.findLast((x) => x % 2 === 0);
  assertSome(result, 4);

  result = list.findLast((x) => x === 6);
  assertNone(result);
});

Deno.test("List.findLastIndex", () => {
  const list = List.of(1, 2, 3, 4, 5);
  let result = list.findLastIndex((x) => x % 2 === 0);
  assertSome(result, 3);

  result = list.findLastIndex((x) => x === 6);
  assertNone(result);
});

Deno.test("List.first", () => {
  let list = List.of(1, 2, 3);
  let result = list.first();
  assertSome(result, 1);

  list = List.empty<number>();
  result = list.first();
  assertNone(result);
});

Deno.test("List.flat", () => {
  const list = List.of([1, 2], [3, 4]);
  const result = list.flat();
  assertEquals([...result], [1, 2, 3, 4]);
});

Deno.test("List.flatMap", () => {
  const list = List.of(1, 2, 3);
  const result = list.flatMap((x) => [x, x * 2]);
  assertEquals([...result], [1, 2, 2, 4, 3, 6]);
});

Deno.test("List.groupBy", () => {
  const list = List.of(
    { type: "apple" },
    { type: "banana" },
    {
      type: "apple",
    },
  );
  const result = list.groupBy((x) => x.type);
  assertEquals(result, {
    apple: [{ type: "apple" }, { type: "apple" }],
    banana: [{ type: "banana" }],
  });
});

Deno.test("List.has", () => {
  const list = List.of(1, 2, 3);
  const result = list.has(2);
  assert(result);

  const result2 = list.has(4);
  assertFalse(result2);
});

Deno.test("List.insertAt", () => {
  const list = List.of(1, 2, 3);
  const result = list.insertAt(1, 4);
  assertEquals([...result], [1, 4, 2, 3]);
});

Deno.test("List.intersection", () => {
  const list1 = List.of(1, 2, 3, 4, 5);
  const list2 = List.of(3, 4, 5, 6, 7);
  const result = list1.intersection(list2);
  assertEquals([...result], [3, 4, 5]);
});

Deno.test("List.isEmpty", () => {
  const list = List.of(1, 2, 3);
  assertFalse(list.isEmpty());

  const list2 = List.empty<number>();
  assert(list2.isEmpty());
});

Deno.test("List.isNotEmpty", () => {
  const list = List.of(1, 2, 3);
  assert(list.isNotEmpty());

  const list2 = List.empty<number>();
  assertFalse(list2.isNotEmpty());
});

Deno.test("List.last", () => {
  let list = List.of(1, 2, 3);
  let result = list.last();
  assertSome(result, 3);

  list = List.empty<number>();
  result = list.last();
  assertNone(result);
});

Deno.test("List.map", () => {
  const list = List.of(1, 2, 3);
  const result = list.map((x) => x * 2);
  assertEquals([...result], [2, 4, 6]);
});

Deno.test("List.move", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.move(1, 3);
  assertEquals([...result], [1, 3, 4, 2, 5]);

  const result2 = list.move(3, 1);
  assertEquals([...result2], [1, 4, 2, 3, 5]);

  const result3 = list.move(1, 1);
  assertEquals([...result3], [1, 2, 3, 4, 5]);
});

Deno.test("List.partition", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const [match, mismatch] = list.partition((x) => x % 2 === 0);
  assertEquals([...match], [2, 4]);
  assertEquals([...mismatch], [1, 3, 5]);

  const list2 = List.from([1, 2, null, 3, undefined, 4]);
  const [match2, mismatch2] = list2.partition(isDefined);
  assertEquals([...match2], [1, 2, 3, 4]);
  assertEquals([...mismatch2], [null, undefined]);
});

Deno.test("List.prepend", () => {
  const list = List.of(1, 2, 3);
  assertEquals([...list.prepend(0)], [0, 1, 2, 3]);
});

Deno.test("List.random should return an element from the list", () => {
  const list = List.from([1, 2, 3]);
  const randomElement = list.random();
  assertSome(randomElement);
  assert(list.has(randomElement.unwrap()));
});

Deno.test("List.random should return undefined for an empty list", () => {
  const emptyList = List.empty<number>();
  const randomElement = emptyList.random();
  assertNone(randomElement);
});

Deno.test(
  "List.random should return each element with roughly equal probability",
  () => {
    const list = List.from([1, 2, 3]);
    const elementCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      const randomElement = list.random();
      assertSome(randomElement);
      elementCounts[randomElement.unwrap()]++;
    }

    Object.values(elementCounts).forEach((count) => {
      const expectedCount = iterations / list.size;
      const tolerance = 0.05 * expectedCount; // Allow 5% tolerance
      assert(
        count > expectedCount - tolerance && count < expectedCount + tolerance,
      );
    });
  },
);

Deno.test("List.reduce", () => {
  const list = List.of(1, 2, 3);
  const result = list.reduce(0, (acc, x) => acc + x);
  assertEquals(result, 6);
});

Deno.test("List.reduceRight", () => {
  const list = List.of(1, 2, 3);
  const result = list.reduceRight(0, (acc, x) => acc + x);
  assertEquals(result, 6);
});

Deno.test("List.removeAt", () => {
  const list = List.of(1, 2, 3);
  const result = list.removeAt(1);
  assertEquals([...result], [1, 3]);
});

Deno.test("List.reverse", () => {
  const list = List.of(1, 2, 3);
  const result = list.reverse();
  assertEquals([...result], [3, 2, 1]);
});

Deno.test('List.rotate("left")', () => {
  const list = List.of(1, 2, 3, 4, 5);
  assertEquals([...list.rotate(-1)], [2, 3, 4, 5, 1]);
  assertEquals([...list.rotate(-2)], [3, 4, 5, 1, 2]);
  assertEquals([...list.rotate(-3)], [4, 5, 1, 2, 3]);
  assertEquals([...list.rotate(-4)], [5, 1, 2, 3, 4]);
  assertEquals([...list.rotate(-5)], [1, 2, 3, 4, 5]);
});

Deno.test('List.rotate("right")', () => {
  const list = List.of(1, 2, 3, 4, 5);
  assertEquals([...list.rotate(1)], [5, 1, 2, 3, 4]);
  assertEquals([...list.rotate(2)], [4, 5, 1, 2, 3]);
  assertEquals([...list.rotate(3)], [3, 4, 5, 1, 2]);
  assertEquals([...list.rotate(4)], [2, 3, 4, 5, 1]);
  assertEquals([...list.rotate(5)], [1, 2, 3, 4, 5]);
});

Deno.test("List.shuffle maintains list length", () => {
  const list = List.from([1, 2, 3, 4, 5]);
  const shuffledList = list.shuffle();
  assertEquals(shuffledList.size, list.size);
});

Deno.test("List.shuffle contains the same elements", () => {
  const list = List.from([1, 2, 3, 4, 5]);
  const shuffledList = list.shuffle();
  const sortedOriginal = list.toArray().sort();
  const sortedShuffled = shuffledList.toArray().sort();
  assertEquals(sortedShuffled, sortedOriginal);
});

Deno.test("List.shuffle produces different orders", () => {
  const list = List.from([1, 2, 3, 4, 5]);
  let similarCount = 0;
  const iterations = 100;
  const originalOrder = list.toArray().toString();

  for (let i = 0; i < iterations; i++) {
    const shuffledList = list.shuffle();
    if (shuffledList.toArray().toString() === originalOrder) {
      similarCount++;
    }
  }

  // Allowing some room for the rare case where shuffle might not change the order
  assertNotEquals(similarCount, iterations);
});

Deno.test("List.shuffle does not mutate the original list", () => {
  const list = List.from([1, 2, 3, 4, 5]);
  const originalCopy = List.from(list);
  list.shuffle();
  assertEquals(list.toArray(), originalCopy.toArray());
});

Deno.test("List.slice", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.slice(1, 4);
  assertEquals([...result], [2, 3, 4]);
});

Deno.test("List.some", () => {
  const list = List.of(1, 2, 3);
  const result = list.some((x) => x === 2);
  assert(result);
});

Deno.test("List.sort (default)", () => {
  const list = List.of(3, 1, 2);
  const result = list.sort();
  assertEquals([...result], [1, 2, 3]);
});

Deno.test("List.sort (custom)", () => {
  const list = List.of(3, 1, 2);
  const result = list.sort((a, b) => a - b);
  assertEquals([...result], [1, 2, 3]);
});

Deno.test("List.splice", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.splice(1, 2, 6, 7);
  assertEquals([...result], [1, 6, 7, 4, 5]);
});

Deno.test("List.swap", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.swap(1, 3);
  assertEquals([...result], [1, 4, 3, 2, 5]);
});

Deno.test("List.take", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.take(2);
  assertEquals([...result], [1, 2]);
});

Deno.test("List.takeWhile", () => {
  const list = List.of(1, 2, 3, 4, 5);
  const result = list.takeWhile((x) => x < 3);
  assertEquals([...result], [1, 2]);
});

Deno.test("List.toArray", () => {
  const list = List.of(1, 2, 3);
  const result = list.toArray();
  assertEquals(result, [1, 2, 3]);
});

Deno.test("List.toSet", () => {
  const list = List.of(1, 2, 3);
  const result = list.toSet();
  assertEquals(result, new Set([1, 2, 3]));
});

Deno.test("List.toString", () => {
  const list = List.of(1, 2, 3);
  const result = list.toString();
  assertEquals(result, "1,2,3");
});

Deno.test("List.union", () => {
  const list1 = List.of(1, 2, 3, 4, 5);
  const list2 = List.of(3, 4, 5, 6, 7);
  const result = list1.union(list2);
  assertEquals([...result], [1, 2, 3, 4, 5, 6, 7]);
});

Deno.test("List.unique", () => {
  const list = List.of(1, 2, 3, 2, 1);
  const result = list.unique();
  assertEquals([...result], [1, 2, 3]);
});

Deno.test("List.uniqueBy", () => {
  const list = List.of({ id: 1 }, { id: 2 }, { id: 1 });
  const result = list.uniqueBy((x) => x.id);
  assertEquals([...result], [{ id: 1 }, { id: 2 }]);
});

Deno.test("List.updateAt", () => {
  const list = List.of(
    { name: "Alice" },
    { name: "Bob" },
    {
      name: "Charlie",
    },
  );
  const result = list.updateAt(1, (x) => ({ ...x, name: "Robert" }));
  assertEquals(
    [...result],
    [{ name: "Alice" }, { name: "Robert" }, { name: "Charlie" }],
  );
});

Deno.test("List.zip", () => {
  const list1 = List.of(1, 2, 3);
  const list2 = List.of("a", "b", "c");
  const result = list1.zip(list2);
  assertEquals(
    [...result],
    [
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ],
  );
});
