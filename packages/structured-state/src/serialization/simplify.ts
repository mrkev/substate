import { SArray, SSchemaArray, SSet } from "..";
import { Struct } from "../Struct";
import { Struct2 } from "../Struct2";
import { Structured } from "../Structured";
import {
  isStructuredKind,
  PrimitiveKind,
  StructuredKind,
} from "../StructuredKinds";
import { exhaustive } from "../assertions";
import {
  isSimplified,
  NSimplified,
  Simplified,
  SimplifiedDescriptor,
  SimplifiedRefOf,
} from "./serialization";
import { LinkedPrimitive } from "../state/LinkedPrimitive";
import { CONTAINER_IGNORE_KEYS } from "../state/SubbableContainer";
import { SUnion } from "../sunion";
import { JSONValue } from "../lib/types";
import { OrderedMap } from "../lib/OrderedMap";

export class SimplificationMetadata {
  readonly allIds = new Set<string>();
  readonly allObjs = new Map<string, Simplified>();
  readonly refered = new OrderedMap<string, Simplified>();

  record<T extends Simplified>(obj: StructuredKind, simplified: T): T {
    // console.log("simplifying", obj._id, simplified.$$);
    if (this.allIds.has(obj._id)) {
      throw new Error("Dubplicate " + obj._id);
    }
    this.allIds.add(obj._id);
    this.allObjs.set(obj._id, simplified);
    // return { $$: "ref", _to: obj._id };
    return simplified;
  }

  reference<T extends Simplified>(simplified: T): SimplifiedRefOf<T["$$"]> {
    const present = this.refered.get(simplified._id);
    if (present != null) {
      throw new Error("object already referenced. Not supported yet.");
    }
    this.refered.push(simplified._id, simplified);
    return { $$: "ref", _id: simplified._id, kind: simplified.$$ };
  }
}

export type SimplePackage = {
  nodes: [string, Simplified][];
  // root: NSimplified["ref"];
  simplified: Simplified;
};

export function simplifyAndPackage(state: StructuredKind): SimplePackage {
  const acc = new SimplificationMetadata();
  const simplified = simplifyStructuredKind(state, acc);
  return {
    nodes: Array.from(acc.refered.entries()),
    // todo: find right kind
    // root: { $$: "ref", _id: state._id, kind: "ref" },
    simplified,
  };
}

export function isSimplePackage(json: unknown): json is SimplePackage {
  // TODO: more validation?
  return (
    typeof json === "object" &&
    json != null &&
    !Array.isArray(json) &&
    "nodes" in json &&
    // "root" in json &&
    "simplified" in json &&
    isSimplified(json.simplified)
  );
}

function simplifyPrimitive(
  obj: LinkedPrimitive<any>,
  acc: SimplificationMetadata
): NSimplified["prim"] | SimplifiedRefOf<"prim"> {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.reference(
    acc.record(obj, {
      $$: "prim",
      _value: obj.get(),
      _id: obj._id,
    })
  );
}

function simplifySimpleArray(
  obj: SArray<any>,
  acc: SimplificationMetadata
): NSimplified["arr-simple"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return acc.record(obj, {
    $$: "arr-simple",
    _value: obj._getRaw().map((x) => simplify(x, acc)),
    _id: obj._id,
  });
}

function simplifySchemaArray(
  obj: SSchemaArray<any>,
  acc: SimplificationMetadata
): NSimplified["arr-schema"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.record(obj, {
    $$: "arr-schema",
    _value: obj._getRaw().map((x) => {
      if (!isStructuredKind(x)) {
        throw new Error("un-knowable found in schema array");
      } else {
        return simplifyStructuredKind(x, acc);
      }
    }),
    _id: obj._id,
  });
}

function simplifyStruct(
  obj: Struct<any>,
  acc: SimplificationMetadata
): NSimplified["struct"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  // offer a way to override simplification
  if ("_simplify" in obj && typeof obj._simplify === "function") {
    return {
      $$: "struct",
      _id: obj._id,
      _value: obj._simplify(),
    };
  }

  // const result: Record<any, any> = { _kind: this._kind };
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj);

  for (const key of keys) {
    if (CONTAINER_IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (obj as any)[key] as unknown;
    result[key] = simplify(val as any, acc);
  }

  return acc.record(obj, {
    $$: "struct",
    _id: obj._id, // reduntant for typescript
    _value: result,
  });
}

function simplifyStruct2(
  obj: Struct2<any>,
  acc: SimplificationMetadata
): NSimplified["struct2"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.record(obj, {
    $$: "struct2",
    _id: obj._id,
    _value: obj.serialize(),
  });
}

function autoSimplify(
  descriptor: Record<string, StructuredKind | PrimitiveKind>,
  acc: SimplificationMetadata
): SimplifiedDescriptor {
  const serializable: SimplifiedDescriptor = {};
  for (const [key, value] of Object.entries(descriptor)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value == null
    ) {
      serializable[key] = value;
    } else if (typeof value === "function") {
      throw new Error("cant simplify function");
    } else if (value instanceof LinkedPrimitive) {
      serializable[key] = simplifyPrimitive(value, acc);
    } else if (value instanceof SArray) {
      serializable[key] = simplifySimpleArray(value, acc);
    } else if (value instanceof SSchemaArray) {
      serializable[key] = simplifySchemaArray(value, acc);
    } else if (value instanceof Struct) {
      serializable[key] = simplifyStruct(value, acc);
    } else if (value instanceof Struct2) {
      serializable[key] = simplifyStruct2(value, acc);
    } else if (value instanceof Structured) {
      serializable[key] = simplifyStructured(value, acc);
    } else if (value instanceof SSet) {
      serializable[key] = simplifySet(value, acc);
    } else if (value instanceof SUnion) {
      serializable[key] = simplifyUnion(value, acc);
    } else {
      exhaustive(value);
    }
  }

  return serializable;
}

export function simplifyStructured(
  obj: Structured<any, any>,
  acc: SimplificationMetadata
): NSimplified["structured"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.record(obj, {
    $$: "structured",
    _id: obj._id,
    _value: autoSimplify(obj.autoSimplify(), acc),
  });
}

function simplifySet(
  obj: SSet<any>,
  acc: SimplificationMetadata
): NSimplified["set"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.record(obj, {
    $$: "set",
    _schema: obj._schema != null,
    _value: obj.map((x) => {
      return simplify(x, acc);
    }),
    _id: obj._id,
  });
}

function simplifyUnion(
  obj: SUnion<any>,
  acc: SimplificationMetadata
): NSimplified["union"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }

  return acc.record(obj, {
    $$: "union",
    _value: simplifyStructuredKind(obj, acc),
    _id: obj._id,
  });
}

function simplify(
  state: StructuredKind | JSONValue,
  acc: SimplificationMetadata
) {
  if (
    typeof state === "string" ||
    typeof state === "number" ||
    typeof state === "boolean" ||
    state == null
  ) {
    return state;
  } else if (typeof state === "function") {
    throw new Error("cant simplify function");
  } else if (
    state instanceof LinkedPrimitive ||
    state instanceof SArray ||
    state instanceof SSchemaArray ||
    state instanceof Struct ||
    state instanceof Struct2 ||
    state instanceof Structured ||
    state instanceof SSet ||
    state instanceof SUnion
  ) {
    return simplifyStructuredKind(state, acc);
  } else if (typeof state === "object") {
    if (state.constructor !== Object && !Array.isArray(state)) {
      throw new Error("cant simplify non-literal object or array");
    }
    return state;
  } else {
    exhaustive(state);
  }
}

export function simplifyPrimitiveKind(state: string | number | boolean | null) {
  return state;
}

export function simplifyStructuredKind(
  state: StructuredKind,
  acc: SimplificationMetadata
): Simplified {
  if (state instanceof LinkedPrimitive) {
    return simplifyPrimitive(state, acc);
  } else if (state instanceof SArray) {
    return simplifySimpleArray(state, acc);
  } else if (state instanceof SSchemaArray) {
    return simplifySchemaArray(state, acc);
  } else if (state instanceof Struct) {
    return simplifyStruct(state, acc);
  } else if (state instanceof Struct2) {
    return simplifyStruct2(state, acc);
  } else if (state instanceof Structured) {
    return simplifyStructured(state, acc);
  } else if (state instanceof SSet) {
    return simplifySet(state, acc);
  } else if (state instanceof SUnion) {
    return simplifyUnion(state, acc);
  } else {
    exhaustive(state);
  }
}
