// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import * as s from "../index";

class Arrays extends s.Struct<Arrays> {
  // readonly numArr = s.array([s.number()]);
  readonly schemaArr = s.arrayOf([Foo]);
  readonly simpleArr = s.array<{ bar: number } | number>();
}

class Foo extends s.Struct<Foo> {
  readonly name = s.string();
}

const arrs = s.create(Arrays, {
  schemaArr: [s.create(Foo, { name: "hello" })],
  simpleArr: [],
});

describe("arrays", () => {
  it("structured hashes up", () => {
    arrs.schemaArr.at(0)?.name.set("bar");
    expect(arrs.schemaArr.at(0)?.name.get()).toEqual("bar");
    expect(arrs.schemaArr.at(0)?._hash).toEqual(1);
    expect(arrs.schemaArr._hash).toEqual(1);
    expect(arrs._hash).toEqual(1);
  });

  it("simple.push", () => {
    arrs.simpleArr.push(2, { bar: 2 });
    expect(arrs.simpleArr.at(0)).toEqual(2);
    expect(arrs.simpleArr.at(1)).toEqual({ bar: 2 });
    expect(arrs.simpleArr._hash).toEqual(1);
    expect(arrs._hash).toEqual(2);
  });
});

// todo: struct tests

// class Foo extends Struct<Foo> {
//   name = string();
//   hello: number;
//   foo = 3;
//   notes = array();

//   constructor(props: StructProps<Foo, { hello: number }>) {
//     super(props);
//     this.hello = props.hello;
//   }
// }

// class Bar extends Struct<Bar> {
//   name = string();
//   foo = 3;
// }

// const foo = create(Foo, { name: "hello", hello: 3, notes: [] });
// const bar = create(Bar, { name: "hello" });

// todo:

// serialization test

/*
  const serialized = serialize(track);
  console.log("serialized", serialized);
  console.log("constructed", construct(serialized, Track));
*/
