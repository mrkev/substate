// import { LinkableArray } from "./LinkableArray";
// import { LinkableMap } from "./LinkableMap";
// import { LinkableValue } from "./LinkableValue";
// import { LinkableSet } from "./LinkableSet";

import { Subbable } from "../lib/Subbable";
import { MarkedSubbable } from "../lib/SubbableMark";

export function printId(obj: MarkedSubbable) {
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

    return obj.constructor.name;
    // return "unknown";
  })();

  const hashStr = `.${obj.$$mark._hash}`;

  return `${obj.constructor.name}:${obj.$$mark._id}${hashStr}`;
  // return `${kindStr}: ${obj._id}${hashStr}`;
}
