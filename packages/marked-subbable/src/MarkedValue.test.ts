import { describe, expect, it } from "vitest";
import { MarkedValue } from "./MarkedValue";

describe("LinkableValue", () => {
  it(".create", () => {
    const prim = MarkedValue.create(3);
    expect(prim).not.toBeNull();
  });

  it(".get", () => {
    const prim = MarkedValue.create(3);
    expect(prim.get()).toEqual(3);
  });

  it(".set", () => {
    const prim = MarkedValue.create("1");
    prim.set("2");
    expect(prim.get()).toEqual("2");
  });
});
