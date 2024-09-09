import { SSet } from ".";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import {
  assertSPrimitive,
  assertSSchemaArray,
  assertSSet,
  assertSSimpleArray,
  assertStruct,
  assertStruct2,
  assertStructured,
  exhaustive,
} from "./assertions";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { initialize } from "./serialization.initialize";
import { simplify } from "./serialization.simplify";
import * as s from "./sstate";
import { SArray, SSchemaArray } from "./sstate";
import { KnowableObject } from "./sstate.history";

// TODO: set, map

export type Serialized =
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
    }>
  | Readonly<{
      $$: "structured";
      _id: string;
      _value: unknown;
    }>
  | Readonly<{
      $$: "set";
      _id: string;
      _value: readonly (Serialized | unknown)[];
    }>;

export type ApplySerialization<T extends KnowableObject> =
  T extends LinkedPrimitive<any>
    ? Extract<Serialized, { $$: "prim" }>
    : T extends Struct<any>
    ? Extract<Serialized, { $$: "struct" }>
    : T extends Struct2<any>
    ? Extract<Serialized, { $$: "struct2" }>
    : T extends Structured<any, any>
    ? Extract<Serialized, { $$: "structured" }>
    : T extends SArray<any>
    ? Extract<Serialized, { $$: "sarray" }>
    : T extends SSchemaArray<any>
    ? Extract<Serialized, { $$: "arr-schema" }>
    : T extends SSet<any>
    ? Extract<Serialized, { $$: "set" }>
    : never;

export type ApplyDeserialization<
  S extends Serialized,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends Extract<Serialized, { $$: "prim" }>
  ? LinkedPrimitive<any>
  : S extends Extract<Serialized, { $$: "struct" }>
  ? Struct<any>
  : S extends Extract<Serialized, { $$: "struct2" }>
  ? Struct2<any>
  : S extends Extract<Serialized, { $$: "structured" }>
  ? Structured<any, any>
  : S extends Extract<Serialized, { $$: "sarray" }>
  ? SArray<any>
  : S extends Extract<Serialized, { $$: "arr-schema" }>
  ? SSchemaArray<T>
  : S extends Extract<Serialized, { $$: "set" }>
  ? SSet<T>
  : never;

export type ObjectDeserialization<
  S extends Serialized,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends Extract<Serialized, { $$: "prim" }>
  ? LinkedPrimitive<any>
  : S extends Extract<Serialized, { $$: "struct" }>
  ? Struct<any>
  : S extends Extract<Serialized, { $$: "struct2" }>
  ? Struct2<any>
  : S extends Extract<Serialized, { $$: "structured" }>
  ? Structured<any, any>
  : S extends Extract<Serialized, { $$: "sarray" }>
  ? T[]
  : S extends Extract<Serialized, { $$: "arr-schema" }>
  ? T[]
  : S extends Extract<Serialized, { $$: "set" }>
  ? Set<T>
  : never;

///////////////////////////////

export function serialize(state: KnowableObject) {
  return JSON.stringify(simplify(state));
}

///////////////////////////////

/** some initializations require a Schema */
export type Schema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | typeof Structured // Struct
  | (typeof Struct | typeof Struct2 | typeof Structured)[]; // SSchemaArray

export type StructSchema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | typeof Structured; // Struct

export type NeedsSchema =
  | Extract<Serialized, { $$: "struct" }>
  | Extract<Serialized, { $$: "struct2" }>
  | Extract<Serialized, { $$: "structured" }>
  | Extract<Serialized, { $$: "arr-schema" }>;

export type NeedsSchemaStruct =
  | Extract<Serialized, { $$: "struct" }>
  | Extract<Serialized, { $$: "struct2" }>
  | Extract<Serialized, { $$: "structured" }>;

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

///////////////////////////////////////

export function replace(json: any, obj: KnowableObject) {
  try {
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
      case "structured": {
        assertStructured(obj);
        return replaceStructured(json, obj);
      }
      case "set": {
        assertSSet(obj);
        return replaceSSet(json, obj);
      }
      default:
        exhaustive(json, "invalid $$ type");
    }
  } catch (e) {
    console.log("error with replace", json);
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
    // TODO: find if item exists in array
    if (isSeralized(x)) {
      // const elem = arr._containedIds.get(x._id) as KnowableObject | null;
      // if (elem != null) {
      //   replace(x, elem);
      //   return;
      // }

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
      // TODO: Serialized state gets replaced separately in history (?)
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

function replaceStructured(
  json: Extract<Serialized, { $$: "structured" }>,
  obj: Structured<any, any>
) {
  obj.replace(json._value);
  obj._notifyChange();
  return;
}

function replaceSSet(json: Extract<Serialized, { $$: "set" }>, obj: SSet<any>) {
  throw new Error("NOT IMPLEMENTED");
  // TODO: SCHEMA?
  const initialized = json._value.map((x) => {
    // TODO: find if item exists in array
    // if (isSeralized(x)) {
    //   // const elem = arr._containedIds.get(x._id) as KnowableObject | null;
    //   // if (elem != null) {
    //   //   replace(x, elem);
    //   //   return;
    //   // }

    //   // TODO: spec?
    //   // return initialize(x, arr._schema[0] as any);
    // } else {
    return x;
    // }
  });

  // obj._setRaw(initialized);
  return;
}

export function isSeralized(json: unknown): json is Serialized {
  // TODO: more validation?
  return (
    typeof json === "object" &&
    json != null &&
    !Array.isArray(json) &&
    "$$" in json
  );
}
