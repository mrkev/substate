import { Struct2 } from "./Struct2";
import {
  assertArray,
  assertConstructableStruct,
  assertConstructableStruct2,
  assertNotArray,
  assertSPrimitive,
  assertSSchemaArray,
  assertSSimpleArray,
  assertStruct,
  assertStruct2,
  exhaustive,
} from "./assertions";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import * as s from "./sstate";
import { SArray, SSchemaArray, Struct } from "./sstate";
import { KnowableObject } from "./sstate.history";
import { JSONValue } from "./types";

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
    }>
  | Readonly<{
      $$: "struct2";
      _id: string;
      _value: readonly unknown[];
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
    _value: obj._getRaw().map((x) => simplify(x)),
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

export function simplifyStruct2(obj: Struct2<any>): Serialized {
  const returned = obj.serialize();

  return {
    $$: "struct2",
    _id: obj._id,
    _value: obj.serialize(),
  };
}

function simplify(state: KnowableObject | JSONValue) {
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
  } else if (typeof state === "object") {
    if (state.constructor !== Object && !Array.isArray(state)) {
      throw new Error("cant simplify non-literal object or array");
    }
    return state;
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
  spec: (typeof Struct | typeof Struct2)[]
) {
  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec);
  });

  return new s.SSchemaArray(initialized as any, json._id, spec);
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
  const { _id, _value } = json;

  // offer a way to override initialization
  if ("_construct" in spec && typeof spec._construct === "function") {
    const instance = spec._construct(_value);
    instance._id = _id;
    // console.log("_constructed", instance, "from", _value);
    instance._initConstructed(Object.keys(_value));
    return instance;
  }

  const initialized: Record<any, any> = {};
  for (const key of Object.keys(_value)) {
    const value = _value[key];
    if (isSeralized(value)) {
      initialized[key] = initialize(_value[key], [initialized[key]?.schema]);
    } else {
      initialized[key] = value;
    }
  }

  const instance = new (spec as any)(_value) as any;
  instance._id = _id;

  for (const key of Object.keys(_value)) {
    const value = _value[key];
    if (isSeralized(value)) {
      instance[key] = initialize(_value[key], [instance[key]?.schema]);
    } else {
      instance[key] = value;
    }
  }

  instance._initConstructed(Object.keys(_value));

  return instance;
}

function initializeStruct2(
  json: Extract<Serialized, { $$: "struct2" }>,
  spec: typeof Struct2
) {
  const { _id, _value } = json;
  const instance = new (spec as any)(..._value);
  instance._id = _id;
  instance._initConstructed(Object.keys(_value));
  return instance;
}

function initialize(
  json: unknown,
  // A union of of the specs this json could follow
  spec:
    | typeof Struct // Struct
    | typeof Struct2 // Struct
    | (typeof Struct | typeof Struct2)[] // SArray
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
      assertConstructableStruct(spec);
      return initializeStruct(json, spec);
    }
    case "struct2": {
      assertNotArray(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec);
    }
    default:
      exhaustive(json, "invalid $$ type");
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
      case "struct2": {
        assertStruct2(obj);
        return replaceStruct2(json, obj);
      }
      default:
        exhaustive(json, "invalid $$ type");
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

  arr._replace(initialized);
}

function replaceSimpleArray(
  json: Extract<Serialized, { $$: "arr-simple" }>,
  arr: SArray<any>
) {
  arr._replace(json._value as any);
}

function replaceStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  obj: Struct<any>
): void {
  // offer a way to override replacement
  if ("_replace" in obj && typeof obj._replace === "function") {
    obj._replace(json._value);
    obj._notifyChange();
    return;
  }

  for (const key in json._value) {
    if (key === "$$" || isSeralized(json._value[key])) {
      // Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  obj._notifyChange();
}

function replaceStruct2(
  json: Extract<Serialized, { $$: "struct2" }>,
  obj: Struct2<any>
): void {
  // offer a way to override replacement
  if ("_replace" in obj && typeof obj._replace === "function") {
    obj._replace(json._value);
    obj._notifyChange();
    return;
  }

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
