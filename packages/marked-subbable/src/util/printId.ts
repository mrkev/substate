// import { LinkableArray } from "./LinkableArray";
// import { LinkableMap } from "./LinkableMap";
// import { LinkableValue } from "./LinkableValue";
// import { LinkableSet } from "./LinkableSet";

import { MarkedSubbable } from "../lib/SubbableMark";

export function printId(obj: MarkedSubbable) {
  const kindStr = (() => {
    return obj.constructor.name;
  })();

  const hashStr = `.${obj.$$mark._hash}`;

  return `${obj.constructor.name}:${obj.$$mark._id}${hashStr}`;
  // return `${kindStr}: ${obj._id}${hashStr}`;
}
