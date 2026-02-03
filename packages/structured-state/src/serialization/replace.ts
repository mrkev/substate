import {
  assertSPrimitive,
  assertSSchemaArray,
  assertSSet,
  assertSSimpleArray,
  assertStruct,
  assertStruct2,
  assertStructured,
  assertSUnion,
  exhaustive,
} from "../lib/assertions";
import { nullthrows } from "../lib/nullthrows";
import { LinkedArray } from "../obj/LinkedArray";
import { LinkedPrimitive } from "../obj/LinkedPrimitive";
import { SSet } from "../obj/LinkedSet";
import { SSchemaArray } from "../obj/SSchemaArray";
import { subbableContainer } from "../state/SubbableContainer";
import { Struct } from "../obj/Struct";
import { Struct2 } from "../obj/Struct2";
import { Structured } from "../obj/Structured";
import { StructuredKind } from "../state/StructuredKinds";
import { SUnion } from "../sunion";
import { InitializationMetadata, initialize } from "./initialize";
import { replaceSchemaArray, replaceSimpleArray } from "./replace.array";
import { replaceSSet } from "./replace.set";
import {
  isSimplified,
  NSimplified,
  Simplified,
  SimplifiedRef,
  SimplifiedSet,
  SimplifiedSimpleArray,
  SimplifiedTypePrimitive,
} from "./serialization";
import { isSimplePackage } from "./simplify";

export function replacePackage(json: unknown, obj: StructuredKind): void {
  if (!isSimplePackage(json)) {
    throw new Error("not a simple package");
  }
  const acc = InitializationMetadata.fromPackage(json);
  return replace(json.simplified, obj, acc);
}

export function replace(
  json: Simplified,
  obj: StructuredKind,
  acc: InitializationMetadata,
) {
  try {
    switch (json.$$) {
      case "prim": {
        assertSPrimitive(obj);
        return replacePrimitive(json, obj, acc);
      }
      case "arr-schema": {
        assertSSchemaArray(obj);
        return replaceSchemaArray(json, obj, acc);
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
        return replaceStructured(json, obj, acc);
      }
      case "set": {
        assertSSet(obj);
        return replaceSSet(json, obj, acc);
      }
      case "union": {
        assertSUnion(obj);
        return replaceSUnion(json, obj);
      }
      case "ref": {
        const simple = nullthrows(
          acc.knownSimples.get(json._id),
          "ref not found",
        );
        return replace(simple, obj, acc);
        // return replaceRef(json, obj, acc);
      }
      default:
        exhaustive(json, "invalid $$ type");
    }
  } catch (e) {
    console.log("error with replace", json);
    throw e;
  }
}

export function replacePrimitive<T>(
  json: SimplifiedTypePrimitive<T> | SimplifiedRef,
  obj: LinkedPrimitive<T>,
  acc: InitializationMetadata,
) {
  switch (json.$$) {
    case "prim": {
      obj.replace(json._value);
      return;
    }
    case "ref": {
      const prim = nullthrows(acc.knownSimples.get(json._id), "ref not found");
      // todo, ensure primitive
      obj.replace((prim as any)._value);
      return;
    }

    default:
      exhaustive(json);
  }
}

function replaceStruct(json: NSimplified["struct"], obj: Struct<any>): void {
  // offer a way to override replacement
  if ("_replace" in obj && typeof obj._replace === "function") {
    obj._replace(json._value);
    subbableContainer._notifyChange(obj, obj);
    return;
  }

  for (const key in json._value) {
    if (key === "$$" || isSimplified(json._value[key])) {
      // TODO: Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  subbableContainer._notifyChange(obj, obj);
}

function replaceStruct2(json: NSimplified["struct2"], obj: Struct2<any>): void {
  // offer a way to override replacement
  if ("_replace" in obj && typeof obj._replace === "function") {
    obj._replace(json._value);
    subbableContainer._notifyChange(obj, obj);
    return;
  }

  for (const key in json._value) {
    if (key === "$$" || isSimplified(json._value[key])) {
      // Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  subbableContainer._notifyChange(obj, obj);
}

export function replaceStructured(
  json: NSimplified["structured"],
  obj: Structured<any, any>,
  acc: InitializationMetadata,
) {
  obj.replace(json._value, replaceOfPkg(acc));
  subbableContainer._notifyChange(obj, obj);
}

export function replaceSUnion(json: NSimplified["union"], obj: SUnion<any>) {
  // todo: Schema. have user deifne a replace function so they can pick the right
  // schema to use when initializing
  // todo: null as any, unimplemented
  const value = initialize(json._value, [], null as any);
  obj.replace(value);
  subbableContainer._notifyChange(obj, obj);
}

export function replaceOfPkg(
  metadata: InitializationMetadata,
): ReplaceFunctions {
  /** `this` on second argument to avoid double-initializing the same elements */
  return {
    string: (
      json: SimplifiedTypePrimitive<string>,
      obj: LinkedPrimitive<string>,
    ) => replacePrimitive<string>(json, obj, metadata),
    number: (
      json: SimplifiedTypePrimitive<number>,
      obj: LinkedPrimitive<number>,
    ) => replacePrimitive<number>(json, obj, metadata),
    boolean: (
      json: SimplifiedTypePrimitive<boolean>,
      obj: LinkedPrimitive<boolean>,
    ) => replacePrimitive<boolean>(json, obj, metadata),
    null: (json: SimplifiedTypePrimitive<null>, obj: LinkedPrimitive<null>) =>
      replacePrimitive<null>(json, obj, metadata),
    primitive: <T>(json: SimplifiedTypePrimitive<T>, obj: LinkedPrimitive<T>) =>
      replacePrimitive(json, obj, metadata),
    schemaArray: <T extends Struct<any> | Struct2<any> | Structured<any, any>>(
      json: NSimplified["arr-schema"],
      arr: SSchemaArray<T>,
    ) => replaceSchemaArray(json, arr, metadata),
    array: replaceSimpleArray,
    struct: replaceStruct,
    struct2: replaceStruct2,
    structured: (json: NSimplified["structured"], obj: Structured<any, any>) =>
      replaceStructured(json, obj, metadata),
    set: (json: NSimplified["set"], set: SSet<any>) =>
      replaceSSet(json, set, metadata),
  } as const;
}

export type ReplaceFunctions = Readonly<{
  string: (
    json: SimplifiedTypePrimitive<string>,
    obj: LinkedPrimitive<string>,
  ) => void;
  number: (
    json: SimplifiedTypePrimitive<number>,
    obj: LinkedPrimitive<number>,
  ) => void;
  boolean: (
    json: SimplifiedTypePrimitive<boolean>,
    obj: LinkedPrimitive<boolean>,
  ) => void;
  null: (
    json: SimplifiedTypePrimitive<null>,
    obj: LinkedPrimitive<null>,
  ) => void;
  primitive: <T>(
    json: SimplifiedTypePrimitive<T>,
    obj: LinkedPrimitive<T>,
  ) => void;
  schemaArray: <T extends Struct<any> | Struct2<any> | Structured<any, any>>(
    json: NSimplified["arr-schema"],
    arr: SSchemaArray<T>,
  ) => void;
  array: <T>(json: SimplifiedSimpleArray<T>, arr: LinkedArray<T>) => void;
  struct: (json: NSimplified["struct"], obj: Struct<any>) => void;
  struct2: (json: NSimplified["struct2"], obj: Struct2<any>) => void;
  structured: (
    json: NSimplified["structured"],
    obj: Structured<any, any>,
  ) => void;
  set: <T>(json: SimplifiedSet<T>, obj: SSet<T>) => void;
}>;
