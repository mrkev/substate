import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/subbable-state";
import { exhaustive } from "./exhaustive";
import { isSerializable, MarkedSerializable } from "./MarkedSerializable";
import { RefPackage } from "./RefPackage";

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
  //
  ref: SimplifiedRef;
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

export type SimplifiedRef = Readonly<{
  $$: "ref";
  _id: string;
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

export type SimplifiedPackage = {
  root: Simplified["any"] | Primitive;
  refs: Record<string, Exclude<Simplified["any"], Simplified["ref"]>>;
};

export function simplifyAndPackage(value: Simplifiable): SimplifiedPackage {
  const refpkg = new RefPackage({});
  const result = simplify(value, refpkg);
  return { root: result, refs: refpkg.refs() };
}

function simplify(
  value: Simplifiable,
  refpkg: RefPackage
): Simplified["any"] | Primitive {
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
    const res = simplifyMarkedObject(value, refpkg);
    const ref = refpkg.record(value.$$mark._id, res);
    return ref;
  } else if (value instanceof MarkedArray) {
    const res = simplifyMarkedArray(value, refpkg);
    const ref = refpkg.record(value.$$mark._id, res);
    return ref;
  } else if (value instanceof MarkedMap) {
    const res = simplifyMarkedMap(value, refpkg);
    const ref = refpkg.record(value.$$mark._id, res);
    return ref;
  } else if (value instanceof MarkedSet) {
    const res = simplifyMarkedSet(value, refpkg);
    const ref = refpkg.record(value.$$mark._id, res);
    return ref;
  } else if (value instanceof MarkedValue) {
    const res = simplifyMarkedValue(value, refpkg);
    const ref = refpkg.record(value.$$mark._id, res);
    return ref;
  } else {
    exhaustive(value);
  }
}

function simplifyMarkedObject<C extends MarkedSerializable<any>>(
  obj: C,
  refpkg: RefPackage
): Simplified["obj"] {
  const serializable: SimplifiedObj["entries"] = {};

  // serialization mark always applies to self
  const description = obj.$$serialization.describe(obj);

  for (const entry of Object.entries(description)) {
    const key = entry[0] as string;
    const value = entry[1] as Simplifiable;
    serializable[key] = simplify(value, refpkg);
  }

  return {
    $$: "obj",
    kind: obj.$$serialization.kind,
    entries: serializable,
  };
}

function simplifyMarkedValue(
  obj: MarkedValue<any>,
  refpkg: RefPackage
): Simplified["val"] {
  return {
    $$: "val",
    value: simplify(
      // todo as any
      obj.get() as any,
      refpkg
    ),
  };
}

function simplifyMarkedArray(
  arr: MarkedArray<any>,
  refpkg: RefPackage
): Simplified["arr"] {
  return {
    $$: "arr",
    entries: arr.map((x) => simplify(x, refpkg)),
  };
}

function simplifyMarkedMap(
  map: MarkedMap<any, any>,
  refpkg: RefPackage
): Simplified["map"] {
  return {
    $$: "map",
    entries: map.map((value, key) => [
      simplify(key, refpkg),
      simplify(value, refpkg),
    ]),
  };
}

function simplifyMarkedSet(
  map: MarkedSet<any>,
  refpkg: RefPackage
): Simplified["set"] {
  return {
    $$: "set",
    entries: map.map((value) => simplify(value, refpkg)),
  };
}
