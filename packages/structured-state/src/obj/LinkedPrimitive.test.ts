import { describe, expect, it } from "vitest";
// Import the package entry first so the module graph loads in an order where
// LinkedPrimitive is defined before the modules that reference it (via
// sstate.history) are evaluated. Importing ./LinkedPrimitive directly as the
// entry point hits a circular-import error.
import "..";
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
