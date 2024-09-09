import { SSet } from ".";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { exhaustive } from "./assertions";
import { LinkedPrimitive } from "../state/LinkedPrimitive";
import { SArray, SSchemaArray } from "./sstate";
import { KnowableObject, isKnowable } from "./sstate.history";
import { JSONValue } from "./types";
import { Serialized } from "./serialization";

function simplifyPrimitive(obj: LinkedPrimitive<any>): Serialized {
  return {
    $$: "prim",
    _value: obj.get(),
    _id: obj._id,
  };
}

function simplifySimpleArray(obj: SArray<any>): Serialized {
  return {
    $$: "arr-simple",
    _value: obj._getRaw().map((x) => simplify(x)),
    _id: obj._id,
  };
}

function simplifySchemaArray(obj: SSchemaArray<any>): Serialized {
  return {
    $$: "arr-schema",
    _value: obj._getRaw().map((x) => {
      if (!isKnowable(x)) {
        throw new Error("un-knowable found in schema array");
      } else {
        return simplify(x);
      }
    }),
    _id: obj._id,
  };
}

function simplifyStruct(obj: Struct<any>): Serialized {
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
    if (Struct.IGNORE_KEYS.has(key)) {
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

function simplifyStruct2(obj: Struct2<any>): Serialized {
  return {
    $$: "struct2",
    _id: obj._id,
    _value: obj.serialize(),
  };
}

function simplifyStructured(obj: Structured<any, any>): Serialized {
  return {
    $$: "structured",
    _id: obj._id,
    _value: obj.serialize(),
  };
}

function simplifySet(obj: SSet<any>): Serialized {
  return {
    $$: "set",
    _value: Array.from(obj._getRaw()).map((x) => {
      return simplify(x);
    }),
    _id: obj._id,
  };
}

export function simplify(state: KnowableObject | JSONValue) {
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
