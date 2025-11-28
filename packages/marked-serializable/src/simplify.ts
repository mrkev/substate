import { exhaustive } from "./exhaustive";
import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/subbable-state";
import { isSerializable, MarkedSerializable } from "./MarkedSerializable";

export type Primitive = number | string | boolean | null;

export type Simplifiable =
  | Primitive
  | MarkedSerializable<any>
  | MarkedArray<any>
  | MarkedSet<any>
  | MarkedMap<any, any>
  | MarkedValue<any>;

export type Simplified = {
  any: Simplified[Exclude<keyof Simplified, "any">];
  obj: SimplifiedObj;
  // MarkedSubbables
  val: SimplifiedMarkedValue;
  arr: SimplifiedMarkedArray;
  set: SimplifiedMarkedSet;
  map: SimplifiedMarkedMap;
};

type SimplifiedObj = Readonly<{
  $$: "obj";
  kind: string;
  entries: Record<string, Simplified["any"] | Primitive>;
}>;

// Support for built-in MarkedSubbables

type SimplifiedMarkedValue = Readonly<{
  $$: "val";
  value: Simplified["any"] | Primitive;
}>;

type SimplifiedMarkedArray = Readonly<{
  $$: "arr";
  entries: readonly (Simplified["any"] | Primitive)[];
}>;

type SimplifiedMarkedSet = Readonly<{
  $$: "set";
  entries: readonly (Simplified["any"] | Primitive)[];
}>;

type SimplifiedMarkedMap = Readonly<{
  $$: "map";
  entries: [Simplified["any"] | Primitive, Simplified["any"] | Primitive][];
}>;

export function isSimplified(json: unknown): json is Simplified["any"] {
  // TODO: more validation?
  return (
    typeof json === "object" &&
    json != null &&
    !Array.isArray(json) &&
    "$$" in json
  );
}

export function isPrimitive(val: unknown) {
  return (
    typeof val === "number" ||
    typeof val === "string" ||
    typeof val === "boolean" ||
    val === null
  );
}

////////////

function simplify(value: Simplifiable): Simplified["any"] | Primitive {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value == null
  ) {
    return value;
  } else if (typeof value === "function") {
    throw new Error("cant simplify function");
  } else if (isSerializable(value)) {
    return simplifyMarkedObject(value);
  } else if (value instanceof MarkedArray) {
    return simplifyMarkedArray(value);
  } else if (value instanceof MarkedMap) {
    return simplifyMarkedMap(value);
  } else if (value instanceof MarkedSet) {
    return simplifyMarkedSet(value);
  } else if (value instanceof MarkedValue) {
    return simplifyMarkedValue(value);
  } else {
    exhaustive(value);
  }
}

export function simplifyMarkedObject<C extends MarkedSerializable<any>>(
  obj: C
): Simplified["any"] {
  const serializable: SimplifiedObj["entries"] = {};

  // serialization mark always applies to self
  const description = obj.$$serialization.describe(obj);

  for (const entry of Object.entries(description)) {
    const key = entry[0] as string;
    const value = entry[1] as Simplifiable;
    serializable[key] = simplify(value);
  }

  return {
    $$: "obj",
    kind: obj.$$serialization.kind,
    entries: serializable,
  };
}

export function simplifyMarkedValue(obj: MarkedValue<any>): Simplified["val"] {
  return {
    $$: "val",
    value: simplify(obj.get() as any), // todo
  };
}

export function simplifyMarkedArray(arr: MarkedArray<any>): Simplified["arr"] {
  return {
    $$: "arr",
    entries: arr.map((x) => simplify(x)),
  };
}

export function simplifyMarkedMap(map: MarkedMap<any, any>): Simplified["map"] {
  return {
    $$: "map",
    entries: map.map((value, key) => [simplify(key), simplify(value)]),
  };
}

export function simplifyMarkedSet(map: MarkedSet<any>): Simplified["set"] {
  return {
    $$: "set",
    entries: map.map((value) => simplify(value)),
  };
}
