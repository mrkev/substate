import {
  assertSPrimitive,
  assertSSchemaArray,
  assertSSimpleArray,
  assertStruct,
} from "./assertions";
import { SPrimitive } from "./lib/state/LinkedState";
import { exhaustive } from "./lib/state/Subbable";
import * as s from "./sstate";
import { SArray, SSchemaArray, Struct } from "./sstate";
import { KnowableObject } from "./sstate.history";

type Serialized =
  | Readonly<{
      $$: "prim";
      _id: string;
      _value: unknown;
    }>
  | Readonly<{
      $$: "arr-schema";
      _id: string;
      _value: (Serialized | unknown)[];
    }>
  | Readonly<{
      $$: "arr-simple";
      _id: string;
      _value: readonly unknown[];
    }>
  | Readonly<{
      $$: "struct";
      _id: string;
      _value: {
        [key: string]: Serialized | unknown;
      };
    }>;

export function simplifyPrimitive(obj: SPrimitive<any>): Serialized {
  return {
    $$: "prim",
    _value: obj.get(),
    _id: obj._id,
  };
}

export function simplifySimpleArray(obj: SArray<any>): Serialized {
  return {
    $$: "arr-simple",
    _value: obj._getRaw(),
    _id: obj._id,
  };
}

export function simplifySchemaArray(obj: SArray<any>): Serialized {
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

export function simplifyStruct(obj: Struct<any>): Serialized {
  // const result: Record<any, any> = { _kind: this._kind };
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj);

  for (const key of keys) {
    if (Struct.IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (obj as any)[key] as unknown;
    if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean" ||
      val == null
    ) {
      result[key] = (obj as any)[key];
    } else if (typeof val === "function") {
      continue;
    } else if (
      val instanceof Struct ||
      val instanceof SArray ||
      val instanceof SPrimitive
    ) {
      result[key] = simplify(val);
    } else {
      result[key] = JSON.stringify(val);
    }
  }

  return {
    // TODO: collisions
    $$: "struct",
    _id: obj._id, // reduntant for typescript
    _value: result,
  };
}

function simplify(state: KnowableObject) {
  if (state instanceof SPrimitive) {
    return simplifyPrimitive(state);
  } else if (state instanceof SArray) {
    return simplifySimpleArray(state);
  } else if (state instanceof SSchemaArray) {
    return simplifySchemaArray(state);
  } else if (state instanceof Struct) {
    return simplifyStruct(state);
  } else {
    exhaustive(state);
  }
}

export function serialize(state: KnowableObject) {
  return JSON.stringify(simplify(state));
}

///////////////////////////////

export function construct(
  str: string,
  spec:
    | s.SState<unknown> // primitives in theory
    | typeof Struct // Struct
    | (s.SState<unknown> | typeof Struct)[] // SArray
) {
  try {
    const json = JSON.parse(str);
    return initialize(json, [spec]);
  } catch (e) {
    console.log("issue with", JSON.parse(str));
    throw e;
  }
}

function initializePrimitive(json: Serialized) {
  return new SPrimitive((json as any)._value, (json as any)._id);
}

function initializeSchemaArray(
  json: Extract<Serialized, { $$: "arr-schema" }>,
  spec: Array<
    | s.SState<unknown> // primitives in theory
    | typeof Struct // Struct
    | (s.SState<unknown> | typeof Struct)[] // SArray
  >
) {
  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec[0] as any);
  });

  return new s.SSchemaArray(initialized, json._id, spec as any);
}

function initializeSimpleArray(
  json: Extract<Serialized, { $$: "arr-simple" }>
) {
  return new SArray(json._value as any, json._id);
}

function initializeStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  spec: Array<
    | s.SState<unknown> // primitives in theory
    | typeof Struct // Struct
    | (s.SState<unknown> | typeof Struct)[] // SArray
  >
) {
  const { $$: _, _id, _value: rest } = json;

  let record = { _id };

  const instance = new (spec[0] as any)(rest) as any;

  for (const key of Object.keys(rest)) {
    const value = (rest as any)[key];
    if (isSeralized(value)) {
      (record as any)[key] = initialize((rest as any)[key], [
        instance[key]?.schema,
      ]);
    } else {
      (record as any)[key] = value;
    }
  }

  instance._initConstructed(record);

  return instance;
}

function initialize(
  json: unknown,
  // A union of of the specs this json could follow
  spec: Array<
    | s.SState<unknown> // primitives in theory
    | typeof Struct // Struct
    | (s.SState<unknown> | typeof Struct)[] // SArray
  >
): SPrimitive<any> | SArray<any> | Struct<any> {
  if (!isSeralized(json)) {
    console.log("not serialized", json);
    throw new Error("invalid serialization is not a non-null object");
  }

  switch (json.$$) {
    case "prim": {
      return initializePrimitive(json);
    }
    case "arr-schema": {
      return initializeSchemaArray(json, spec);
    }
    case "arr-simple": {
      return initializeSimpleArray(json);
    }
    case "struct": {
      return initializeStruct(json, spec);
    }
    default:
      throw new Error("invalid $$ type");
  }
}

///////////////////////////////////////

export function replace(str: string, obj: KnowableObject) {
  try {
    const json = JSON.parse(str);

    if (!isSeralized(json)) {
      throw new Error("invalid serialization is not a non-null object");
    }

    switch (json.$$) {
      case "prim": {
        assertSPrimitive(obj);
        return replacePrimitive(json, obj);
      }
      case "arr-schema": {
        assertSSchemaArray(obj);
        return replaceSchemaArray(json, obj);
      }
      case "arr-simple": {
        assertSSimpleArray(obj);
        return replaceSimpleArray(json, obj);
      }
      case "struct": {
        assertStruct(obj);
        return replaceStruct(json, obj);
      }
      default:
        throw new Error("invalid $$ type");
    }
  } catch (e) {
    console.log("error with replace", JSON.parse(str));
    throw e;
  }
}

function replacePrimitive(
  json: Extract<Serialized, { $$: "prim" }>,
  obj: SPrimitive<any>
) {
  obj.replace(json._value as any);
}

function replaceSchemaArray(
  json: Extract<Serialized, { $$: "arr-schema" }>,
  arr: SSchemaArray<any>
) {
  // TODO: HOW DO I MERGE?
  const initialized = json._value.map((x) => {
    if (isSeralized(x)) {
      // TODO: spec?
      return initialize(x, arr._schema);
    } else {
      return x;
    }
  });

  // TODO: don't initialize whole new array
  const copy = new SArray(initialized, "foobar");
  arr._replace(copy);
}

function replaceSimpleArray(
  json: Extract<Serialized, { $$: "arr-simple" }>,
  arr: SArray<any>
) {
  // TODO: don't initialize whole new SArray
  const copy = new SArray(json._value as any, "foobar");
  arr._replace(copy);
}

function replaceStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  obj: Struct<any>
) {
  for (const key in json._value) {
    if (key === "$$" || isSeralized(json._value[key])) {
      // Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  obj._notifyReplaced();
}

function isSeralized(json: unknown): json is Serialized {
  // TODO: more validation?
  return (
    typeof json === "object" &&
    json != null &&
    !Array.isArray(json) &&
    "$$" in json
  );
}

function isKnowable(val: unknown) {
  return (
    val instanceof Struct || val instanceof SArray || val instanceof SPrimitive
  );
}
