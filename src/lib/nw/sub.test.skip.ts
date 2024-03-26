import {
  array,
  boolean,
  map,
  nil,
  number,
  object,
  string,
  union,
} from "./nwschema";
import { describe, expect, it } from "vitest";

describe("matchers", () => {
  it("String", () => {
    const sub = string().concretize("hello");
    expect(sub.peek()).toEqual("hello");

    sub.set("world");
    expect(sub.peek()).toEqual("world");

    sub.replace("foobar");
    expect(sub.peek()).toEqual("foobar");
  });

  it("Number", () => {
    const sub = number().concretize(2);
    expect(sub.peek()).toEqual(2);
  });

  it("Boolean", () => {
    const sub = boolean().concretize(true);
    expect(sub.peek()).toEqual(true);
  });

  it("Nil", () => {
    const sub = nil().concretize(null);
    expect(sub.peek()).toEqual(null);
  });

  it("Map (simple)", () => {
    const simple = map({ "[key: string]": number() }).concretize({
      foo: 3,
      bar: 2,
      baz: 1,
    });
    expect(simple.peek()).toEqual({ foo: 3, bar: 2, baz: 1 });
  });

  it("Array", () => {
    const simple = array(string()).concretize(["foo", "bar", "baz"]);
    expect(simple.peek()).toEqual(["foo", "bar", "baz"]);
  });

  it("Object", () => {
    // unimplemented
    expect(() =>
      object({ hello: number(), world: string() }).concretize({
        hello: 3,
        world: "foo",
      })
    ).toThrow();
  });

  it("Union", () => {
    const sub = union(string(), number()).concretize("hello");
    expect(sub.peek()).toEqual("hello");
  });
});
