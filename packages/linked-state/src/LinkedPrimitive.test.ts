import { describe, expect, it } from "vitest";
import { LinkedPrimitive } from "./LinkedPrimitive";

describe("LinkedPrimitive", () => {
  it(".of", () => {
    const prim = LinkedPrimitive.of(3);
    expect(prim).not.toBeNull();
  });

  it(".get", () => {
    const prim = LinkedPrimitive.of(3);
    expect(prim.get()).toEqual(3);
  });

  it(".set", () => {
    const prim = LinkedPrimitive.of("1");
    prim.set("2");
    expect(prim.get()).toEqual("2");
  });
});
