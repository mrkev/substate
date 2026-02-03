import { describe, expect, it } from "vitest";
import { LinkedArray } from "./LinkedArray";

describe("SArray", () => {
  it(".of", () => {
    const arr = LinkedArray.create();
    expect(arr).not.toBeNull();
  });

  it(".at", () => {
    const arr = LinkedArray.create(["foo", "bar"]);
    expect(arr.at(0)).toEqual("foo");
  });

  it(".push", () => {
    const arr = LinkedArray.create();
    arr.push("1", "2");
    expect(arr.at(1)).toEqual("2");
  });
});
