// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../index";
import { setOf } from "../sstate";
import { Minimal } from "../testUtils";

describe("set", () => {
  it("add, hashes up", () => {
    const set = s.set<number>([3]);
    set.add(5);
    expect(set.has(5)).toEqual(true);
    expect(set.size).toEqual(2);
    expect(set._hash).toEqual(1);
  });

  it("serializes, constructs", () => {
    const set = s.SSet._create([2], "foobar", null);
    const serialized = s.serialize(set);
    expect(serialized).toMatchSnapshot();
    const constructed = s.construct(serialized, null);
    expect(constructed).toMatchSnapshot();
  });
});

describe("setOf", () => {
  it("add, hashes up", () => {
    const set = setOf(Minimal, []);
    const min = s.Structured.create(Minimal);
    set.add(min);
    expect(set.has(min)).toEqual(true);
    expect(set.size).toEqual(1);
    expect(set._hash).toEqual(1);
  });

  it("serializes, constructs", () => {
    const min = Minimal.withId("minid");
    const set = s.SSet._create([min], "setid", Minimal);
    const serialized = s.serialize(set);
    expect(serialized).toMatchSnapshot();
    console.log("constructing");
    const constructed = s.construct(serialized, Minimal);
    console.log(constructed);
    expect(constructed).toMatchSnapshot();
  });
});
