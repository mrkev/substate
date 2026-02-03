import { describe, expect, it } from "vitest";
import * as Struct from "../Struct";
import { boolean, nil, number, string } from "../sstate";

class Primitives extends Struct.Struct<Primitives> {
  readonly num = number(0);
  readonly str = string("hello world");
  readonly bool = boolean(false);
  readonly nil = nil();
}

const prim = Struct.create(Primitives, {});

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
