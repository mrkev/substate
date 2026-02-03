import { SArray, SSchemaArray, Struct } from "..";
import { nullthrows } from "../lib/nullthrows";
import { Struct2 } from "../Struct2";
import { Structured } from "../Structured";
import { InitializationMetadata, initialize } from "./initialize";
import { replaceOfPkg } from "./replace";
import {
  isSeralizedStructured,
  isSimplified,
  NSimplified,
  Simplified,
  SimplifiedSimpleArray,
} from "./serialization";

export function replaceSchemaArray<
  T extends Struct<any> | Struct2<any> | Structured<any, any>,
>(
  json: NSimplified["arr-schema"],
  arr: SSchemaArray<T>,
  acc: InitializationMetadata,
) {
  // arr is current state, we want json by the end
  arr._replace((raw) => {
    const jsonIndex = new Map<string, Simplified>();
    const jsonOrder: string[] = [];
    for (const elem of json._value) {
      if (!isSimplified(elem)) {
        console.error(
          "ERR: non structured object found in SSchemaArray. skipping replace.",
        );
        continue;
      }
      jsonIndex.set(elem._id, elem);
      jsonOrder.push(elem._id);
    }

    const arrIndex = new Map<string, T>();

    // 1. delete all elements not present in serialized version.
    //    - the rest we keep and index for later
    for (let i = raw.length - 1; i >= 0; i--) {
      const struct = nullthrows(raw.at(i));
      if (jsonIndex.has(struct._id)) {
        arrIndex.set(struct._id, struct);
      } else {
        raw.splice(i, 1);
      }
    }

    // 2. replace all the elements present in arr and json
    for (const [_, elem] of jsonIndex) {
      const struct = arrIndex.get(elem._id);
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
        struct.replace(elem._value, replaceOfPkg(acc));
      }
    }

    // 3. add all new elements from json
    for (const [id, elem] of jsonIndex) {
      if (arrIndex.has(id)) {
        continue;
      }
      const initialized = initialize(elem, arr._schema[0], acc);
      raw.push(initialized as any); // todo: as any
    }

    // 4. ensure order is same as in serialized version
    // note: sort runs the
    raw.sort((a, b) => {
      const aIndex = jsonOrder.indexOf(a._id);
      if (aIndex < 0) {
        // debugger;
        console.warn(
          "replace: arr has an element not in json, this should never happen",
        );
      }
      const bIndex = jsonOrder.indexOf(b._id);
      if (bIndex < 0) {
        console.warn(
          "replace: arr has an element not in json, this should never happen",
        );
      }

      return aIndex - bIndex;
    });

    return raw;
  });
}

export function replaceSimpleArray<T>(
  json: SimplifiedSimpleArray<T>,
  arr: SArray<T>,
) {
  arr._replace((raw) => {
    return json._value;
  });
}
