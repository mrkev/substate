import { describe, expect, it } from "vitest";
import * as s from "../index";
import { replacePackage } from "../serializaiton.replace";
import { simplifyAndPackage } from "../serialization.simplify";
import { StructSchema } from "../StructuredKinds";
import { Minimal } from "../testUtils";

const testSet = <T>(initialValue?: Iterable<T>) =>
  s.SSet._create(initialValue, "foobar", undefined);

const testSetOf = <T extends StructSchema>(
  schema: T,
  initialValue?: Iterable<InstanceType<T>>
) => s.SSet._create(initialValue, "setid", schema);

describe("set", () => {
  it("add, hashes up", () => {
    const set = testSet([3]);
    set.add(5);
    expect(set.has(5)).toEqual(true);
    expect(set.size).toEqual(2);
    expect(set._hash).toEqual(1);
  });

  it("replaces", () => {
    const set = testSet([1, 2, 3, 4, 5]);
    const pkg = simplifyAndPackage(set);
    set.add(6);
    set.add(7);
    set.add(8);
    set.add(9);
    set.add(10);
    expect(set.size).toBe(10);

    set.delete(1);
    set.delete(2);
    set.delete(3);

    expect(set.size).toBe(7);
    replacePackage(pkg, set);
    expect(set.size).toBe(5);
    expect(set).toMatchSnapshot();
  });

  it("serializes, constructs", () => {
    const set = testSet([2]);
    const serialized = s.serialize(set);
    expect(serialized).toMatchSnapshot();
    const constructed = s.construct(serialized, null);
    expect(constructed).toMatchSnapshot();
  });
});

describe("setOf", () => {
  it("add, hashes up", () => {
    const set = testSetOf(Minimal, []);
    const min = Minimal.withId("minid");
    set.add(min);
    expect(set.has(min)).toEqual(true);
    expect(set.size).toEqual(1);
    expect(set._hash).toEqual(1);
  });

  it("replaces", () => {
    const [one, two, three] = [
      Minimal.withId("1"),
      Minimal.withId("2"),
      Minimal.withId("3"),
    ];

    const set = testSetOf(Minimal, [
      one,
      two,
      three,
      Minimal.withId("4"),
      Minimal.withId("5"),
    ]);
    const pkg = simplifyAndPackage(set);
    set.add(Minimal.withId("6"));
    set.add(Minimal.withId("7"));
    set.add(Minimal.withId("8"));
    set.add(Minimal.withId("9"));
    set.add(Minimal.withId("10"));
    expect(set.size).toBe(10);

    set.delete(one);
    set.delete(two);
    set.delete(three);

    expect(set.size).toBe(7);
    replacePackage(pkg, set);
    expect(set.size).toBe(5);
    expect(set).toMatchSnapshot();
  });

  it("serializes, constructs", () => {
    const min = Minimal.withId("minid");
    const set = testSetOf(Minimal, [min]);
    const serialized = s.serialize(set);
    expect(serialized).toMatchSnapshot();
    const constructed = s.construct(serialized, Minimal);
    expect(constructed).toMatchSnapshot();
  });
});
