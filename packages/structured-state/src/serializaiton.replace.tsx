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
import {
  isSeralized,
  isSeralizedStructured,
  NSerialized,
  Serialized,
  SerializedTypePrimitive,
} from "./serialization";
import { initialize } from "./serialization.initialize";
import { SArray, SSchemaArray } from "./sstate";
import { _directPush, _directRemove } from "./state/LinkedArray";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { SubbableContainer } from "./state/SubbableContainer";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { StructuredKind } from "./StructuredKinds";

export function replace(json: any, obj: StructuredKind) {
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

export function replacePrimitive<T>(
  json: SerializedTypePrimitive<T>,
  obj: LinkedPrimitive<T>
) {
  obj.replace(json._value);
}

export function replaceSchemaArray<
  T extends Struct<any> | Struct2<any> | Structured<any, any, any>
>(json: NSerialized["arr-schema"], arr: SSchemaArray<T>) {
  arr._replace((raw) => {
    const jsonSet = new Map<string, Serialized>();
    const jsonOrder: string[] = [];
    for (const elem of json._value) {
      if (!isSeralized(elem)) {
        console.warn(
          "non structured object found in SSchemaArray. skipping replace."
        );
        continue;
      }
      jsonSet.set(elem._id, elem);
      jsonOrder.push(elem._id);
    }

    // 1. delete all elements not present in serialized version
    for (const struct of raw) {
      if (!jsonSet.has(struct._id)) {
        _directRemove(raw, struct);
      }
    }

    // now make the arrSet
    const arrSet = new Map<string, T>();
    for (const struct of raw) {
      arrSet.set(struct._id, struct);
    }

    // 2. replace all the elements present in arr and json
    for (const [_, elem] of jsonSet) {
      const struct = arrSet.get(elem._id);
      if (struct == null) {
        continue;
      } else if (struct instanceof Struct || struct instanceof Struct2) {
        // TODO: Struct has no replace?
        console.warn("TODO: can't replace on Struct/Struct2");
        continue;
      } else {
        if (!isSeralizedStructured(elem)) {
          throw new Error("Expected serialized Structure, found " + elem.$$);
        }
        struct.replace(elem._autoValue);
      }
    }

    // 3. add all new elements from json
    // TODO: child elements have new id, not JSON id
    // could be solved by serializng only in Structured format, and forcing deserialization to be recursive.
    // thus, on deserialization we would always have the id of the object being deserialized/constructed
    for (const [id, elem] of jsonSet) {
      if (arrSet.has(id)) {
        continue;
      }
      const initialized = initialize(elem, arr._schema[0] as any);
      console.log("INITIALIZED", initialized);

      _directPush(raw, initialized as any); // todo: as any
    }

    // 4. ensure order is same as in serialized version
    // note: sort runs the
    raw.sort((a, b) => {
      const aIndex = jsonOrder.indexOf(a._id);
      if (aIndex < 0) {
        console.warn(
          "replace: arr has an element not in json, this should never happen"
        );
      }
      const bIndex = jsonOrder.indexOf(b._id);
      if (bIndex < 0) {
        console.warn(
          "replace: arr has an element not in json, this should never happen"
        );
      }

      return aIndex - bIndex;
    });

    console.log("raw", raw);
    return raw;
  });
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
    SubbableContainer._notifyChange(obj, obj);
    return;
  }

  for (const key in json._value) {
    if (key === "$$" || isSeralized(json._value[key])) {
      // TODO: Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  SubbableContainer._notifyChange(obj, obj);
}

function replaceStruct2(
  json: Extract<Serialized, { $$: "struct2" }>,
  obj: Struct2<any>
): void {
  // offer a way to override replacement
  if ("_replace" in obj && typeof obj._replace === "function") {
    obj._replace(json._value);
    SubbableContainer._notifyChange(obj, obj);
    return;
  }

  for (const key in json._value) {
    if (key === "$$" || isSeralized(json._value[key])) {
      // Serialized state gets replaced separately in history (?)
      continue;
    }
    (obj as any)[key] = json._value[key];
  }
  SubbableContainer._notifyChange(obj, obj);
}

export function replaceStructured(
  json: NSerialized["structured"],
  obj: Structured<any, any, any>
) {
  obj.replace(json._autoValue);
  SubbableContainer._notifyChange(obj, obj);
}

export function replaceSSet(
  json: Extract<Serialized, { $$: "set" }>,
  obj: SSet<any>
) {
  throw new Error("NOT IMPLEMENTED");
  // TODO: SCHEMA?
  const initialized = json._value.map((x) => {
    // TODO: find if item exists in array
    // if (isSeralized(x)) {
    //   // const elem = arr._containedIds.get(x._id) as StructuredKind | null;
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
