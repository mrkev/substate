import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
  SubbableMark,
  subbable,
} from "@mrkev/marked-subbable";
import { describe, expect, it, vi } from "vitest";
import { constructSimplifiedPackage } from "./construct";
import {
  consolidateMarks,
  MarkedSerializable,
  SerializationIndex,
  SerializationMark,
} from "./MarkedSerializable";
import { Simplifiable, SimplifiedPackage, simplifyAndPackage } from "./simplify";

/** serialize to a JSON string and back, like saving and loading */
function roundTrip(
  value: Simplifiable,
  index: SerializationIndex = consolidateMarks([]),
) {
  const json = JSON.stringify(simplifyAndPackage(value));
  return constructSimplifiedPackage(JSON.parse(json), index);
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

/** A custom object holding two children, which may be the same object. */
class Pair
  implements MarkedSubbable, MarkedSerializable<typeof pairSerialization>
{
  readonly $$mark = SubbableMark.create();
  readonly $$serialization = pairSerialization;
  static simplified = 0; // how many times a Pair was serialized

  constructor(
    readonly left: Simplifiable,
    readonly right: Simplifiable,
  ) {
    this.$$mark.register(this, [left, right]);
  }
}

const pairSerialization: SerializationMark<
  { left: Simplifiable; right: Simplifiable },
  Pair
> = SerializationMark.create({
  kind: "pair",
  construct: ({ left, right }) => new Pair(left, right),
  simplify: (pair) => {
    Pair.simplified++;
    return { left: pair.left, right: pair.right };
  },
});

const pairIndex = consolidateMarks([pairSerialization]);

describe("round trips", () => {
  it("MarkedValue", () => {
    const back = roundTrip(MarkedValue.create(5)) as MarkedValue<number>;
    expect(back).toBeInstanceOf(MarkedValue);
    expect(back.get()).toBe(5);
  });

  it("MarkedArray, with nested marked values linked", () => {
    const back = roundTrip(
      MarkedArray.create<unknown>([1, MarkedValue.create("x")]),
    ) as MarkedArray<unknown>;
    expect(back).toBeInstanceOf(MarkedArray);
    expect(back[0]).toBe(1);
    const nested = back[1] as MarkedValue<string>;
    expect(nested).toBeInstanceOf(MarkedValue);
    expect(nested.get()).toBe("x");
    expect(linked(nested, back)).toBe(true);
  });

  it("MarkedSet", () => {
    const back = roundTrip(MarkedSet.create(["a", "b"])) as MarkedSet<string>;
    expect(back).toBeInstanceOf(MarkedSet);
    expect([...back]).toEqual(["a", "b"]);
  });

  it("a custom object, with its children rebuilt and linked", () => {
    const back = roundTrip(
      new Pair(MarkedValue.create(1), 2),
      pairIndex,
    ) as Pair;
    expect(back).toBeInstanceOf(Pair);
    const left = back.left as MarkedValue<number>;
    expect(left).toBeInstanceOf(MarkedValue);
    expect(left.get()).toBe(1);
    expect(back.right).toBe(2);
    expect(linked(left, back)).toBe(true);
  });
});

describe("shared objects", () => {
  it("come back as one instance", () => {
    const shared = MarkedValue.create("s");
    const back = roundTrip(
      MarkedArray.create([shared, shared]),
    ) as MarkedArray<MarkedValue<string>>;
    expect(back[0]).toBe(back[1]);
    expect(back[0].$$mark._container.get(back)).toBe(2);
  });

  it("are serialized once", () => {
    // each level holds the level below twice: 11 Pairs, reachable through
    // 2^11 - 1 paths. Holding the same child twice makes `register` warn
    // (shared state is usually a mistake); here it's on purpose.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let node: Simplifiable = MarkedValue.create(0);
    for (let i = 0; i < 11; i++) {
      node = new Pair(node, node);
    }
    Pair.simplified = 0;
    const pkg = simplifyAndPackage(node);
    expect(Pair.simplified).toBe(11);
    expect(Object.keys(pkg.refs)).toHaveLength(12);
    expect(warn).toHaveBeenCalledTimes(11);
    warn.mockRestore();
  });
});

describe("errors", () => {
  it("loading an unknown kind throws", () => {
    expect(() => roundTrip(new Pair(1, 2))).toThrow(
      "kind pair not found in SerializationIndex",
    );
  });

  it("consolidateMarks rejects duplicate kinds", () => {
    expect(() =>
      consolidateMarks([pairSerialization, pairSerialization]),
    ).toThrow("Duplicate mark pair!");
  });

  it("saving a cycle throws a clear error", () => {
    const a = MarkedArray.create<unknown>([]);
    const b = MarkedArray.create<unknown>([a]);
    a.push(b);
    expect(() => simplifyAndPackage(a)).toThrow(
      `can't serialize a cycle: MarkedArray ${a.$$mark._id} contains itself`,
    );
  });

  it("saving a cycle through a custom object names its kind", () => {
    const arr = MarkedArray.create<unknown>([]);
    const pair = new Pair(arr, 1);
    arr.push(pair);
    expect(() => simplifyAndPackage(pair)).toThrow(
      `can't serialize a cycle: pair ${pair.$$mark._id} contains itself`,
    );
  });

  it("loading a cyclic package throws a clear error", () => {
    const pkg: SimplifiedPackage = {
      root: { $$: "ref", _id: "A" },
      refs: {
        A: { $$: "arr", entries: [{ $$: "ref", _id: "B" }] },
        B: { $$: "arr", entries: [{ $$: "ref", _id: "A" }] },
      },
    };
    expect(() => constructSimplifiedPackage(pkg, consolidateMarks([]))).toThrow(
      "can't load a cycle: A contains itself",
    );
  });
});
