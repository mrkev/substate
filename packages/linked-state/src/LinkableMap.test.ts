import { describe, expect, it } from "vitest";
import { LinkableMap } from "./LinkableMap";

describe("LinkableMap", () => {
  it(".create", () => {
    const map = LinkableMap.create();
    expect(map).not.toBeNull();
  });

  it(".get", () => {
    const map = LinkableMap.create([["foo", "bar"]]);
    expect(map.get("foo")).toEqual("bar");
  });

  it(".set", () => {
    const map = LinkableMap.create();
    map.set("2", "2");
    expect(map.get("2")).toEqual("2");
  });
});
