// import { LinkableArray } from "./LinkableArray";
// import { LinkableMap } from "./LinkableMap";
// import { LinkableValue } from "./LinkableValue";
// import { LinkableSet } from "./LinkableSet";
import { MutationHashable, mutationHashable } from "../lib/MutationHashable";

export function printId(obj: MutationHashable) {
  const kindStr = (() => {
    // if (obj instanceof LinkableMap) {
    //   return "lmap";
    // } else if (obj instanceof LinkableArray) {
    //   return "larr";
    // } else if (obj instanceof LinkableSet) {
    //   return "lset";
    // } else if (obj instanceof LinkableValue) {
    //   return "lprm";
    // } else {
    //   return "unknown";
    // }

    return "unknown";
  })();

  const hashStr = `.${mutationHashable.getMutationHash(obj)}`;

  return `${obj.constructor.name}: ${obj._id}${hashStr}`;
  // return `${kindStr}: ${obj._id}${hashStr}`;
}
