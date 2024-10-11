// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../index";

type SFoo = {
  // todo: can use serialized type for SSet?
  numset: number[];
};

class AudioContext {}

class Foo extends s.Structured<SFoo, typeof Foo> {
  override autoSimplify(): Record<string, s.StructuredKind | s.PrimitiveKind> {
    return {
      numset: this.numset,
    };
  }

  readonly numset = s.set<number>();

  // All this is just boilerplate ugh
  override replace(json: SFoo): void {
    this.numset._setRaw(new Set(json.numset));
  }
  override serialize(): SFoo {
    return { numset: Array.from(this.numset) };
  }

  static construct(external: AudioContext): Foo {
    return new Foo(external);
  }
  constructor(external: AudioContext) {
    super();
  }
}

const sets = s.Structured.create(Foo, new AudioContext());

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
