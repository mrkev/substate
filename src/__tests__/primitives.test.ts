// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../sstate";

class Primitives extends s.Struct<Primitives> {
  readonly num = s.number(0);
  readonly str = s.string("hello world");
  readonly bool = s.boolean(false);
  readonly nil = s.nil();
}

const prim = s.create(Primitives, {});

describe("sstate", () => {
  it("string", () => {
    prim.str.set("2");
    expect(prim.str.get()).toEqual("2");
  });

  it("number", () => {
    prim.num.set(3);
    expect(prim.num.get()).toEqual(3);
  });

  it("boolean", () => {
    prim.bool.set(true);
    expect(prim.bool.get()).toEqual(true);
  });

  it("nil", () => {
    prim.nil.set(null);
    expect(prim.nil.get()).toEqual(null);
  });

  it("hashes: 4 changes", () => {
    expect(prim._hash).toEqual(4);
  });
});
