import { SSet } from ".";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import {
  isStructuredKind,
  PrimitiveKind,
  StructuredKind,
} from "./StructuredKinds";
import { exhaustive } from "./assertions";
import { NSerialized, Serialized, SerializedDescriptor } from "./serialization";
import { SArray, SSchemaArray } from "./sstate";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { CONTAINER_IGNORE_KEYS } from "./state/SubbableContainer";
import { JSONValue } from "./types";

function simplifyPrimitive(obj: LinkedPrimitive<any>): NSerialized["prim"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "prim",
    _value: obj.get(),
    _id: obj._id,
  };
}

function simplifySimpleArray(obj: SArray<any>): NSerialized["arr-simple"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "arr-simple",
    _value: obj._getRaw().map((x) => simplify(x)),
    _id: obj._id,
  };
}

function simplifySchemaArray(
  obj: SSchemaArray<any>
): NSerialized["arr-schema"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "arr-schema",
    _value: obj._getRaw().map((x) => {
      if (!isStructuredKind(x)) {
        throw new Error("un-knowable found in schema array");
      } else {
        return simplify(x);
      }
    }),
    _id: obj._id,
  };
}

function simplifyStruct(obj: Struct<any>): NSerialized["struct"] {
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
    result[key] = simplify(val as any);
  }

  return {
    $$: "struct",
    _id: obj._id, // reduntant for typescript
    _value: result,
  };
}

function simplifyStruct2(obj: Struct2<any>): NSerialized["struct2"] {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "struct2",
    _id: obj._id,
    _value: obj.serialize(),
  };
}

function autoSimplify(
  descriptor: Record<string, StructuredKind | PrimitiveKind>
): SerializedDescriptor {
  const serializable = {} as any;
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
      serializable[key] = simplifyPrimitive(value);
    } else if (value instanceof SArray) {
      serializable[key] = simplifySimpleArray(value);
    } else if (value instanceof SSchemaArray) {
      serializable[key] = simplifySchemaArray(value);
    } else if (value instanceof Struct) {
      serializable[key] = simplifyStruct(value);
    } else if (value instanceof Struct2) {
      serializable[key] = simplifyStruct2(value);
    } else if (value instanceof Structured) {
      serializable[key] = simplifyStructured(value);
    } else if (value instanceof SSet) {
      serializable[key] = simplifySet(value);
    } else {
      exhaustive(value);
    }
  }

  return serializable;
}

function simplifyStructured(obj: Structured<any, any, any>): Serialized {
  // console.log("simplifyStructured", autoSimplify(obj.autoSimplify()));
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "structured",
    _id: obj._id,
    // todo: can remove .serialize() once we remove static .construct() too,
    // now that .autoSimplify() is required
    _value: obj.serialize(),
    _autoValue: autoSimplify(obj.autoSimplify()),
  };
}

function simplifySet(obj: SSet<any>): Serialized {
  if (obj._container.size > 1) {
    console.warn("multiple containers reference", obj);
  }
  return {
    $$: "set",
    _value: Array.from(obj._getRaw()).map((x) => {
      return simplify(x);
    }),
    _id: obj._id,
  };
}

export function simplify(state: StructuredKind | JSONValue) {
  if (
    typeof state === "string" ||
    typeof state === "number" ||
    typeof state === "boolean" ||
    state == null
  ) {
    return state;
  } else if (typeof state === "function") {
    throw new Error("cant simplify function");
  } else if (state instanceof LinkedPrimitive) {
    return simplifyPrimitive(state);
  } else if (state instanceof SArray) {
    return simplifySimpleArray(state);
  } else if (state instanceof SSchemaArray) {
    return simplifySchemaArray(state);
  } else if (state instanceof Struct) {
    return simplifyStruct(state);
  } else if (state instanceof Struct2) {
    return simplifyStruct2(state);
  } else if (state instanceof Structured) {
    return simplifyStructured(state);
  } else if (state instanceof SSet) {
    return simplifySet(state);
  } else if (typeof state === "object") {
    if (state.constructor !== Object && !Array.isArray(state)) {
      throw new Error("cant simplify non-literal object or array");
    }
    return state;
  } else {
    exhaustive(state);
  }
}
