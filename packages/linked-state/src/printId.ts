import { LinkedArray } from "./LinkedArray";
import { LinkedMap } from "./LinkedMap";
import { LinkedPrimitive } from "./LinkedPrimitive";
import { LinkedSet } from "./LinkedSet";
import { MutationHashable, mutationHashable } from "./MutationHashable";

export function printId(obj: MutationHashable) {
  const kindStr = (() => {
    if (obj instanceof LinkedMap) {
      return "lmap";
    } else if (obj instanceof LinkedArray) {
      return "larr";
    } else if (obj instanceof LinkedSet) {
      return "lset";
    } else if (obj instanceof LinkedPrimitive) {
      return "lprm";
    } else {
      return "unknown";
    }
  })();

  const hashStr = `.${mutationHashable.getMutationHash(obj)}`;

  return `${obj.constructor.name}: ${obj._id}${hashStr}`;
  // return `${kindStr}: ${obj._id}${hashStr}`;
}
