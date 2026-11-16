import {
  MarkedMap,
  MarkedSubbable,
  MarkedValue,
  subbable,
} from "@mrkev/marked-subbable";
import { describe, expect, it } from "vitest";
import { constructSimplifiedPackage } from "./construct";
import { consolidateMarks } from "./MarkedSerializable";
import { Simplifiable, simplifyAndPackage } from "./simplify";

/** serialize to a JSON string and back, like saving and loading */
function roundTrip(value: Simplifiable) {
  const json = JSON.stringify(simplifyAndPackage(value));
  return constructSimplifiedPackage(JSON.parse(json), consolidateMarks([]));
}

function linked(child: MarkedSubbable, parent: MarkedSubbable) {
  return child.$$mark._container.has(parent);
}

describe("MarkedMap round trip", () => {
  it("keeps primitive keys and values", () => {
    const map = MarkedMap.create<string, unknown>([
      ["a", 1],
      ["b", "two"],
      ["c", true],
      ["d", null],
    ]);
    const back = roundTrip(map);
    expect(back).toBeInstanceOf(MarkedMap);
    expect([...(back as MarkedMap<string, unknown>).entries()]).toEqual([
      ["a", 1],
      ["b", "two"],
      ["c", true],
      ["d", null],
    ]);
  });

  it("rebuilds marked values, linked to the map", () => {
    const map = MarkedMap.create([["a", MarkedValue.create("x")]]);
    const back = roundTrip(map) as MarkedMap<string, MarkedValue<string>>;

    const value = back.get("a");
    expect(value).toBeInstanceOf(MarkedValue);
    expect(value?.get()).toBe("x");
    expect(linked(value!, back)).toBe(true);

    // changing the value notifies the map
    let notified = 0;
    subbable.subscribe(back, () => notified++);
    value!.set("y");
    expect(notified).toBe(1);
  });

  it("rebuilds marked keys, linked to the map", () => {
    const map = MarkedMap.create([[MarkedValue.create("k"), 1]]);
    const back = roundTrip(map) as MarkedMap<MarkedValue<string>, number>;

    const [[key, value]] = [...back.entries()];
    expect(key).toBeInstanceOf(MarkedValue);
    expect(key.get()).toBe("k");
    expect(value).toBe(1);
    expect(linked(key, back)).toBe(true);
  });

  it("keeps an empty map empty", () => {
    const back = roundTrip(MarkedMap.create());
    expect(back).toBeInstanceOf(MarkedMap);
    expect((back as MarkedMap<unknown, unknown>).size).toBe(0);
  });
});
