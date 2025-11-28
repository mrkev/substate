import { exhaustive } from "../../../../structured-state/src/assertions";
import { isSerializable, MarkedSerializable } from "./MarkedSerializable";

export type Primitive = number | string | boolean | null;

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
  value: readonly (Simplified["any"] | Primitive)[];
}>;

type SimplifiedMarkedSet = Readonly<{
  $$: "set";
  value: readonly (Simplified["any"] | Primitive)[];
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

export type Descriptor = Record<string, Primitive | MarkedSerializable<any>>;

export function simplifyMarkedObject<
  D extends Descriptor,
  C extends MarkedSerializable<any>
>(obj: C): Simplified["any"] {
  const serializable: SimplifiedObj["entries"] = {};

  // serialization mark always applies to self
  const description = obj.$$serialization.describe(obj);

  for (const entry of Object.entries(description)) {
    const key = entry[0] as string;
    const value = entry[1] as Primitive | MarkedSerializable<any>;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value == null
    ) {
      serializable[key] = value;
    } else if (typeof value === "function") {
      throw new Error("cant simplify function");
    } else if (isSerializable(value)) {
      serializable[key] = simplifyMarkedObject(value);
    } else {
      exhaustive(value);
    }
  }

  return {
    $$: "obj",
    kind: obj.$$serialization.kind,
    entries: serializable,
  };
}
