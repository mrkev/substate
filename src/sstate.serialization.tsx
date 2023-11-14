import {
  assertArray,
  assertNotArray,
  assertSPrimitive,
  assertSSchemaArray,
  assertSSimpleArray,
  assertStruct,
  exhaustive,
} from "./assertions";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
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

export function simplifyPrimitive(obj: LinkedPrimitive<any>): Serialized {
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
      val instanceof SSchemaArray ||
      val instanceof LinkedPrimitive
    ) {
      result[key] = simplify(val);
    } else {
      console.log(val);
      result[key] = JSON.stringify(val);
    }
  }

  return {
    $$: "struct",
    _id: obj._id, // reduntant for typescript
    _value: result,
  };
}

function simplify(state: KnowableObject) {
  if (state instanceof LinkedPrimitive) {
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

export type Schema =
  | s.SState<unknown> // primitives in theory
  | typeof Struct // Struct
  | (s.SState<unknown> | typeof Struct)[]; // SArray

export function construct(
  str: string,
  spec:
    | s.SState<unknown>
    | typeof Struct // Struct
    | (typeof Struct)[] // SArray
) {
  try {
    const json = JSON.parse(str);
    return initialize(json, spec as any);
  } catch (e) {
    console.log("issue with", JSON.parse(str));
    throw e;
  }
}

function initializePrimitive(json: Extract<Serialized, { $$: "prim" }>) {
  return new LinkedPrimitive(json._value, json._id);
}

function initializeSchemaArray(
  json: Extract<Serialized, { $$: "arr-schema" }>,
  spec: (typeof Struct)[]
) {
  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec);
  });

  return new s.SSchemaArray(initialized, json._id, spec);
}

function initializeSimpleArray(
  json: Extract<Serialized, { $$: "arr-simple" }>
) {
  return new SArray(json._value as any, json._id);
}

function initializeStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  spec: typeof Struct
) {
  const { $$: _, _id, _value: rest } = json;

  let record = { _id };

  const instance = new spec(rest as any) as any;

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
  spec:
    | typeof Struct // Struct
    | (typeof Struct)[] // SArray
): LinkedPrimitive<any> | SArray<any> | Struct<any> {
  if (!isSeralized(json)) {
    console.log("not serialized", json);
    throw new Error("invalid serialization is not a non-null object");
  }

  switch (json.$$) {
    case "prim": {
      return initializePrimitive(json);
    }
    case "arr-schema": {
      assertArray(spec);
      return initializeSchemaArray(json, spec);
    }
    case "arr-simple": {
      return initializeSimpleArray(json);
    }
    case "struct": {
      assertNotArray(spec);
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
  obj: LinkedPrimitive<any>
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
      return initialize(x, arr._schema[0] as any);
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
  obj._notifyChange();
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
    val instanceof Struct ||
    val instanceof SArray ||
    val instanceof LinkedPrimitive
  );
}
