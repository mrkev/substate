// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../index";

class Foo extends s.Structured<null, typeof Foo> {
  readonly numset = s.set<number>();

  // All this is just boilerplate ugh
  override replace(json: null): void {}
  override serialize(): null {
    return null;
  }
  static construct(): Foo {
    return new Foo();
  }
  constructor() {
    super();
  }
}

const sets = s.Structured.create(Foo);

describe("sets", () => {
  it("add, hashes up", () => {
    sets.numset.add(5);
    expect(sets.numset.has(5)).toEqual(true);
    expect(sets.numset._hash).toEqual(1);
    expect(sets._hash).toEqual(1);
  });

  it("clear", () => {
    sets.numset.clear();
    expect(sets.numset._hash).toEqual(2);
    expect(sets._hash).toEqual(2);
  });
});
