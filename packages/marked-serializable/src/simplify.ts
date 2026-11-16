import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
} from "@mrkev/marked-subbable";
import { exhaustive } from "./exhaustive";
import {
  Description,
  isSerializable,
  MarkedSerializable,
  SerializationMark,
} from "./MarkedSerializable";
import { RefMap, SimplifiedNonRef } from "./RefMap";

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
  root: Simplified["ref"] | Primitive;
  refs: Record<string, Exclude<Simplified["any"], Simplified["ref"]>>;
};

export function simplifyAndPackage(value: Simplifiable): SimplifiedPackage {
  const refpkg = new RefMap({});
  const result = simplify(value, refpkg);
  return { root: result, refs: refpkg.index() };
}

function simplify(
  value: Simplifiable,
  refmap: RefMap,
): Simplified["ref"] | Primitive {
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
    return simplifyOnce(value, refmap, () =>
      simplifyMarkedObject(value, refmap),
    );
  } else if (value instanceof MarkedArray) {
    return simplifyOnce(value, refmap, () =>
      simplifyMarkedArray(value, refmap),
    );
  } else if (value instanceof MarkedMap) {
    return simplifyOnce(value, refmap, () => simplifyMarkedMap(value, refmap));
  } else if (value instanceof MarkedSet) {
    return simplifyOnce(value, refmap, () => simplifyMarkedSet(value, refmap));
  } else if (value instanceof MarkedValue) {
    return simplifyOnce(value, refmap, () =>
      simplifyMarkedValue(value, refmap),
    );
  } else {
    exhaustive(value);
  }
}

/**
 * Serializes a marked object once, as a ref into the package. An object
 * reachable from several places is serialized the first time and referenced
 * after that. An object that (indirectly) contains itself is a cycle, which
 * loading can't rebuild yet, so that throws instead of recursing forever.
 */
function simplifyOnce(
  value: MarkedSubbable,
  refmap: RefMap,
  simplifyContents: () => SimplifiedNonRef,
): SimplifiedRef {
  const id = value.$$mark._id;
  if (refmap.has(id)) {
    return { $$: "ref", _id: id };
  }
  if (refmap.isPending(id)) {
    const name = isSerializable(value)
      ? value.$$serialization.kind
      : value.constructor.name;
    throw new Error(`can't serialize a cycle: ${name} ${id} contains itself`);
  }
  refmap.markPending(id);
  return refmap.record(id, simplifyContents());
}

function simplifyMarkedObject<
  C extends MarkedSerializable<SerializationMark<Description, C>>,
>(obj: C, refpkg: RefMap): Simplified["obj"] {
  const serializable: SimplifiedObj["entries"] = {};

  // serialization mark always applies to self
  const description = obj.$$serialization.describe(obj);

  for (const entry of Object.entries(description)) {
    const key = entry[0];
    const value = entry[1];
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
  refpkg: RefMap,
): Simplified["val"] {
  return {
    $$: "val",
    value: simplify(
      // todo as any
      obj.get() as any,
      refpkg,
    ),
  };
}

function simplifyMarkedArray(
  arr: MarkedArray<any>,
  refpkg: RefMap,
): Simplified["arr"] {
  return {
    $$: "arr",
    entries: arr.map((x) => simplify(x, refpkg)),
  };
}

function simplifyMarkedMap(
  map: MarkedMap<any, any>,
  refpkg: RefMap,
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
  refpkg: RefMap,
): Simplified["set"] {
  return {
    $$: "set",
    entries: map.map((value) => simplify(value, refpkg)),
  };
}
