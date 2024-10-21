// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../index";
import { Structured } from "../index";

type SFoo = {
  // todo: can use serialized type for SSet?
  numset: number[];
};

type AutoFoo = {
  numset: s.SSet<number>;
};

class AudioContext {}

/** Foo includes external value in constructor */
class Foo extends s.Structured<SFoo, AutoFoo, typeof Foo> {
  constructor(
    //
    readonly numset: s.SSet<number>,
    readonly external: AudioContext
  ) {
    super();
  }

  static of(external: AudioContext) {
    return Structured.create(Foo, s.set<number>(), external);
  }

  override autoSimplify() {
    return {
      numset: this.numset,
    };
  }

  // All this is just boilerplate ugh
  override replace(auto: s.JSONOfAuto<AutoFoo>): void {
    s.replace.set(auto.numset, this.numset);
    // this.numset._setRaw(new Set(json.numset));
  }

  override serialize(): SFoo {
    return { numset: Array.from(this.numset) };
  }

  // TODO: this is wrong actually
  static construct(external: AudioContext): Foo {
    return new Foo(s.set<number>(), external);
  }
}

const sets = Foo.of(new AudioContext());

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
