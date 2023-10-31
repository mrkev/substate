import { describe, expect, it } from "vitest";
import * as nw from "./nwschema";
import type { SubNumber } from "./subschema";
import {
  array,
  boolean,
  map,
  nil,
  number,
  object,
  string,
  union,
} from "./subschema";

describe("get", () => {
  it("String", () => {
    const str = string("hello");
    expect(str.peek()).toEqual("hello");
  });

  it("String.concretized", () => {
    const str = nw.string().concretize("hello");
    expect(str.peek()).toEqual("hello");
  });

  it("Number", () => {
    const num = number(4);
    expect(num.peek()).toEqual(4);
  });

  it("Boolean", () => {
    const bool = boolean(true);
    expect(bool.peek()).toEqual(true);
  });

  it("Nil", () => {
    const noop = nil(null);
    expect(noop.peek()).toEqual(null);
  });

  it("Object", () => {
    const objectTest = object(
      { foo: number(3) },
      nw.object({
        foo: nw.number(),
      })
    );
    expect(objectTest.peek()).toEqual({ foo: 3 });
  });

  it("Object.concretized", () => {
    const definition = nw.object({
      foo: nw.number(),
    });
    const objectTest = definition.concretize({ foo: 3 });

    expect(objectTest.peek()).toEqual({ foo: 3 });
  });

  it("Union", () => {
    const str = union(string("hello"), nw.union(nw.string(), nw.nil()));
    expect(str.peek()).toEqual("hello");

    const objectTest = union(
      object(
        { foo: number(3) },
        nw.object({
          foo: nw.number(),
        })
      ),
      nw.union(
        nw.object({
          foo: nw.number(),
        }),
        nw.nil()
      )
    );
    // const foo = objectTest.peek();
    expect(objectTest.peek()).toEqual({ foo: 3 });
  });

  it("Map", () => {
    const schema = nw.map({ "[key: string]": nw.number() });
    const res = schema.concretize({ foo: 3 });

    const mapTest = map({ foo: number(3), bar: number(2) }, schema);
    expect(mapTest.peek()).toEqual({ foo: 3, bar: 2 });
  });

  it("Optional *", () => {
    // TODO
  });

  it("Array", () => {
    const arr = array<SubNumber>([number(2), number(3)], nw.array(nw.number()));
    expect(arr.peek()).toEqual([2, 3]);
  });
});

describe("set", () => {
  it("String", () => {
    const str = string("hello");
    str.set("world");
    expect(str.peek()).toEqual("world");
  });

  it("Number", () => {
    const str = number(3);
    str.set(2);
    expect(str.peek()).toEqual(2);
  });

  it("Boolean", () => {
    const bool = boolean(true);
    bool.set(false);
    expect(bool.peek()).toEqual(false);
  });

  it("Nil", () => {
    const noop = nil(null);
    noop.set(null);
    expect(noop.peek()).toEqual(null);
  });

  // Should unions be settable?
  // it("Union", () => {
  //   const str = union(string("hello"), nw.union(nw.string(), nw.nil()));
  //   str.set(null);
  //   expect(str.peek()).toEqual(null);
  // });
});

describe("at", () => {
  it("Object", () => {
    const objectTest = object(
      {
        foo: number(3),
        bar: number(2),
      },
      nw.object({
        foo: nw.number(),
        bar: nw.number(),
      })
    );

    expect(objectTest.at("foo").peek()).toEqual(3);
  });

  it("Map", () => {
    const mapTest = map(
      {
        foo: number(3),
        bar: number(2),
      },
      nw.map({ "[key: string]": nw.number() })
    );
    expect(mapTest.at("foo")?.peek()).toEqual(3);
    expect(mapTest.at("baz")).toEqual(null);
  });

  it("Array", () => {
    const arr = array<SubNumber>(
      [number(0), number(1), number(2), number(3), number(4), number(5)],
      nw.array(nw.number())
    );
    expect(arr.at(0)?.peek()).toEqual(0);
    expect(arr.at(6)).toEqual(null);
  });
});
