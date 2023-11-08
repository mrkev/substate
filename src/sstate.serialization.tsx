import { assertSArray, assertSPrimitive, assertStruct } from "./assertions";
import { LinkedArray } from "./lib/state/LinkedArray";
import { SPrimitive } from "./lib/state/LinkedState";
import { exhaustive } from "./lib/state/Subbable";
import * as s from "./sstate";
import { Struct } from "./sstate";
import { KnowableObject } from "./sstate.history";

type Serialized =
  | Readonly<{
      $$: "prim";
      _id: string;
      _value: unknown;
    }>
  | Readonly<{
      $$: "arr";
      _id: string;
      _value: Serialized[];
    }>
  | Readonly<{
      $$: "struct";
      _id: string;
      _value: {
        [key: string]: Serialized;
      };
    }>;

type SimplifiedData = Serialized | string | boolean | number | null;

export function simplifyPrimitive(obj: SPrimitive<any>): Serialized {
  return {
    $$: "prim",
    _value: obj.get(),
    _id: obj._id,
  };
}

export function simplifyArray(obj: s.SArray<any>): Serialized {
  return {
    $$: "arr",
    _value: obj._getRaw().map((x) => simplify(x)),
    _id: obj._id,
  };
}

const STRUCT_IGNORE_KEYS = new Set([
  "_hash",
  "_subscriptors",
  "_container",
  "stateKeys",
  "_unsub",
]);

export function simplifyStruct(obj: Struct<any>): Serialized {
  // const result: Record<any, any> = { _kind: this._kind };
  const result: Record<string, any> = {};
  const keys = Object.keys(obj);

  for (const key of keys) {
    if (STRUCT_IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (obj as any)[key];
    if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean" ||
      val == null
    ) {
      result[key] = (obj as any)[key];
    } else if (typeof val === "function") {
      continue;
    } else {
      result[key] = simplify((obj as any)[key]);
    }
  }

  return {
    // TODO: collisions
    $$: "struct",
    _id: obj._id, // reduntant for typescript
    _value: result,
  };
}

function simplify(state: Struct<any> | s.SArray<any> | SPrimitive<any>) {
  if (state instanceof SPrimitive) {
    return simplifyPrimitive(state);
  } else if (state instanceof LinkedArray) {
    return simplifyArray(state);
  } else if (state instanceof Struct) {
    return simplifyStruct(state);
  } else {
    exhaustive(state);
  }
}

export function serialize(
  state: Struct<any> | s.SArray<any> | SPrimitive<any>
) {
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
  const json = JSON.parse(str);
  return initialize(json, [spec]);
}

function initializePrimitive(json: Serialized) {
  return new SPrimitive((json as any)._value, (json as any)._id);
}

function initializeArray(
  json: Serialized,
  spec: Array<
    | s.SState<unknown> // primitives in theory
    | typeof Struct // Struct
    | (s.SState<unknown> | typeof Struct)[] // SArray
  >
) {
  const initialized = (json as any)._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec[0] as any);
  });

  return new s.SArray(spec as any, initialized, json._id);
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

  const instance = new (spec[0] as any)() as any;

  for (const key of Object.keys(rest)) {
    const value = initialize((rest as any)[key], [instance[key]?.schema]);
    (record as any)[key] = value;
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
): SPrimitive<any> | s.SArray<any> | Struct<any> {
  if (typeof json !== "object" || json == null || Array.isArray(json)) {
    throw new Error("invalid serialization is not a non-null object");
  }

  // TODO: more validation?
  if (!("$$" in json)) {
    throw new Error("invalid serialization has no type");
  }

  switch (json.$$) {
    case "prim": {
      return initializePrimitive(json as any);
    }
    case "arr": {
      return initializeArray(json as any, spec);
    }
    case "struct": {
      return initializeStruct(json as any, spec);
    }
    default:
      throw new Error("invalid $$ type");
  }
}

///////////////////////////////////////

export function replace(str: string, obj: KnowableObject) {
  const json = JSON.parse(str);

  if (typeof json !== "object" || json == null || Array.isArray(json)) {
    throw new Error("invalid serialization is not a non-null object");
  }

  // TODO: more validation?
  if (!("$$" in json)) {
    throw new Error("invalid serialization has no type");
  }

  switch (json.$$) {
    case "prim": {
      assertSPrimitive(obj);
      return replacePrimitive(json, obj);
    }
    case "arr": {
      assertSArray(obj);
      return replaceArray(json, obj);
    }
    case "struct": {
      assertStruct(obj);
      return replaceStruct(json, obj);
    }
    default:
      throw new Error("invalid $$ type");
  }
}

function replacePrimitive(
  json: Extract<Serialized, { $$: "prim" }>,
  obj: SPrimitive<any>
) {
  obj.replace(json._value as any);
}

function replaceArray(
  json: Extract<Serialized, { $$: "arr" }>,
  arr: s.SArray<any>
) {
  // TODO: HOW DO I MERGE?
  const initialized = json._value.map((x) => {
    // TODO: find right spec
    return initialize(x, arr._schema as any);
  });

  const copy = new s.SArray(arr._schema, initialized, "foobar");
  arr._replace(copy);
}

function replaceStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  obj: Struct<any>
) {
  throw new Error("structs can't be put in history?");
}
