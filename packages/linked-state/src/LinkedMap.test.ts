import { describe, expect, it } from "vitest";
import { LinkedMap } from "./LinkedMap";

describe("LinkedMap", () => {
  it(".of", () => {
    const map = LinkedMap.create();
    expect(map).not.toBeNull();
  });

  it(".get", () => {
    const map = LinkedMap.create(new Map([["foo", "bar"]]));
    expect(map.get("foo")).toEqual("bar");
  });

  it(".set", () => {
    const map = LinkedMap.create();
    map.set("2", "2");
    expect(map.get("2")).toEqual("2");
  });
});
