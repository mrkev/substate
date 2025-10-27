import { describe, expect, it } from "vitest";
import { SArray } from "./SArray";

describe("SArray", () => {
  it(".of", () => {
    const arr = SArray.create();
    expect(arr).not.toBeNull();
  });

  it(".at", () => {
    const arr = SArray.create(["foo", "bar"]);
    expect(arr.at(0)).toEqual("foo");
  });

  it(".push", () => {
    const arr = SArray.create();
    arr.push("1", "2");
    expect(arr.at(1)).toEqual("2");
  });
});
