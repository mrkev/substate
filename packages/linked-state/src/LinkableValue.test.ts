import { describe, expect, it } from "vitest";
import { LinkableValue } from "./LinkableValue";

describe("LinkableValue", () => {
  it(".create", () => {
    const prim = LinkableValue.create(3);
    expect(prim).not.toBeNull();
  });

  it(".get", () => {
    const prim = LinkableValue.create(3);
    expect(prim.get()).toEqual(3);
  });

  it(".set", () => {
    const prim = LinkableValue.create("1");
    prim.set("2");
    expect(prim.get()).toEqual("2");
  });
});
