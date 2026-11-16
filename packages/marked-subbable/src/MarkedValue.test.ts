import { describe, expect, it } from "vitest";
import { subbable } from "./lib/Subbable";
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

  it(".set uncontains the old value and contains the new one", () => {
    const a = MarkedValue.create(0);
    const b = MarkedValue.create(1);
    const holder = MarkedValue.create<MarkedValue<number>>(a);
    expect(a.$$mark._container.has(holder)).toBe(true);

    holder.set(b);
    expect(a.$$mark._container.has(holder)).toBe(false);
    expect(b.$$mark._container.has(holder)).toBe(true);

    // the old value no longer notifies its former holder
    let notified = 0;
    const unsub = subbable.subscribe(holder, () => notified++);
    a.set(5);
    expect(notified).toBe(0);
    b.set(6);
    expect(notified).toBe(1);
    unsub();
  });

  it(".set with the same value keeps it contained", () => {
    const a = MarkedValue.create(0);
    const holder = MarkedValue.create<MarkedValue<number>>(a);
    holder.set(a);
    expect(a.$$mark._container.has(holder)).toBe(true);
  });
});
