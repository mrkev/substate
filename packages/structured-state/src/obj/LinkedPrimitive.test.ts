import { describe, expect, it } from "vitest";
import { LinkedPrimitive } from "./LinkedPrimitive";

describe("sstate", () => {
  it("LinkedPrimitive.of", () => {
    const prim = LinkedPrimitive.of(3);
    expect(prim.get()).toEqual(3);
  });

  it(".set", () => {
    const prim = LinkedPrimitive.of("1");
    prim.set("2");
    expect(prim.get()).toEqual("2");
  });
});
