import { describe, expect, it } from "vitest";
import { subbable } from "./lib/Subbable";
import { MarkedSubbable } from "./lib/SubbableMark";
import { MarkedMap } from "./MarkedMap";
import { MarkedValue } from "./MarkedValue";

function linked(child: MarkedSubbable, parent: MarkedSubbable) {
  return child.$$mark._container.has(parent);
}

function countNotifications(obj: MarkedSubbable) {
  const counter = { count: 0, unsubscribe: () => {} };
  counter.unsubscribe = subbable.subscribe(obj, () => counter.count++);
  return counter;
}

describe("MarkedMap", () => {
  it(".create", () => {
    const map = MarkedMap.create();
    expect(map).not.toBeNull();
  });

  it(".get", () => {
    const map = MarkedMap.create([["foo", "bar"]]);
    expect(map.get("foo")).toEqual("bar");
  });

  it(".set", () => {
    const map = MarkedMap.create();
    map.set("2", "2");
    expect(map.get("2")).toEqual("2");
  });

  it(".create links keys and values", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create([[k, v]]);
    expect(linked(k, map)).toBe(true);
    expect(linked(v, map)).toBe(true);
  });

  it(".set on a new key links the key and value", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create<MarkedValue<string>, MarkedValue<string>>();
    map.set(k, v);
    expect(linked(k, map)).toBe(true);
    expect(linked(v, map)).toBe(true);
  });

  it(".set on an existing key replaces the value and keeps the key linked", () => {
    const k = MarkedValue.create("k");
    const v1 = MarkedValue.create("v1");
    const v2 = MarkedValue.create("v2");
    const map = MarkedMap.create([[k, v1]]);
    map.set(k, v2);
    expect(linked(k, map)).toBe(true);
    expect(linked(v1, map)).toBe(false);
    expect(linked(v2, map)).toBe(true);
  });

  it(".delete unlinks the key and value", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create([[k, v]]);
    expect(map.delete(k)).toBe(true);
    expect(linked(k, map)).toBe(false);
    expect(linked(v, map)).toBe(false);
  });

  it(".delete works with null and undefined values", () => {
    const map = MarkedMap.create<string, null | undefined>([
      ["a", null],
      ["b", undefined],
    ]);
    expect(map.delete("a")).toBe(true);
    expect(map.delete("b")).toBe(true);
    expect(map.size).toBe(0);
  });

  it("notifies recursive listeners when a key or value changes", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create([[k, v]]);
    const targets: MarkedSubbable[] = [];
    subbable.subscribe(map, (target) => targets.push(target));
    k.set("k2");
    v.set("v2");
    expect(targets).toEqual([k, v]);
  });

  it(".clear unlinks keys and values", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create([[k, v]]);
    map.clear();
    expect(map.size).toBe(0);
    expect(linked(k, map)).toBe(false);
    expect(linked(v, map)).toBe(false);

    // they no longer notify the map
    const counter = countNotifications(map);
    k.set("k2");
    v.set("v2");
    expect(counter.count).toBe(0);
  });

  it(".clear on an empty map doesn't notify", () => {
    const map = MarkedMap.create();
    const counter = countNotifications(map);
    map.clear();
    expect(counter.count).toBe(0);
  });

  it(".replace links new entries and unlinks old ones", () => {
    const oldK = MarkedValue.create("oldK");
    const oldV = MarkedValue.create("oldV");
    const newK = MarkedValue.create("newK");
    const newV = MarkedValue.create("newV");
    const map = MarkedMap.create([[oldK, oldV]]);
    map.replace(new Map([[newK, newV]]));

    expect([...map.entries()]).toEqual([[newK, newV]]);
    expect(linked(oldK, map)).toBe(false);
    expect(linked(oldV, map)).toBe(false);
    expect(linked(newK, map)).toBe(true);
    expect(linked(newV, map)).toBe(true);
  });

  it(".replace keeps linked the entries present in both maps", () => {
    const k = MarkedValue.create("k");
    const v = MarkedValue.create("v");
    const map = MarkedMap.create([[k, v]]);
    map.replace(new Map([[k, v]]));
    expect(linked(k, map)).toBe(true);
    expect(linked(v, map)).toBe(true);
  });

  it(".replace of an empty map with an empty map doesn't notify", () => {
    const map = MarkedMap.create();
    const counter = countNotifications(map);
    map.replace(new Map());
    expect(counter.count).toBe(0);
  });

  describe("duplicates", () => {
    it("the same value under two keys stays linked after deleting one", () => {
      const v = MarkedValue.create("v");
      const map = MarkedMap.create([
        ["a", v],
        ["b", v],
      ]);
      expect(v.$$mark._container.get(map)).toBe(2);
      map.delete("a");
      expect(linked(v, map)).toBe(true);
      map.delete("b");
      expect(linked(v, map)).toBe(false);
    });

    it("overwriting one of two keys holding the same value keeps it linked", () => {
      const v = MarkedValue.create("v");
      const map = MarkedMap.create([
        ["a", v],
        ["b", v],
      ]);
      map.set("a", MarkedValue.create("other"));
      expect(linked(v, map)).toBe(true);
    });

    it("an object that is both a key and a value is counted twice", () => {
      const kv = MarkedValue.create("kv");
      const map = MarkedMap.create<MarkedValue<string>, MarkedValue<string>>([
        [kv, kv],
      ]);
      expect(kv.$$mark._container.get(map)).toBe(2);
      map.set(kv, MarkedValue.create("other"));
      // still a key
      expect(linked(kv, map)).toBe(true);
      map.delete(kv);
      expect(linked(kv, map)).toBe(false);
    });
  });

  it(".map returns an array, calling back with value, key and the map", () => {
    const map = MarkedMap.create([
      ["a", 1],
      ["b", 2],
    ]);
    expect(map.map((v, k, m) => [k, v * 10, m === map])).toEqual([
      ["a", 10, true],
      ["b", 20, true],
    ]);
  });
});
