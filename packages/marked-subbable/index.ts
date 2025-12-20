import { MarkedArray } from "./src/MarkedArray";
import { MarkedMap } from "./src/MarkedMap";
import { MarkedSet } from "./src/MarkedSet";
import { MarkedValue } from "./src/MarkedValue";
export { printId } from "./src/printId";

export { MarkedArray } from "./src/MarkedArray";
export { MarkedMap } from "./src/MarkedMap";
export { MarkedSet } from "./src/MarkedSet";
export { MarkedValue } from "./src/MarkedValue";

export { SubbableMark } from "./lib/SubbableMark";
export type { MarkedSubbable } from "./lib/SubbableMark";

export { DebugTree } from "./debug/DebugTree";

export {
  //
  useLink,
} from "./src/useLink";

export const mSet = MarkedSet.create.bind(MarkedSet);
export const mArray = MarkedArray.create.bind(MarkedArray);
export const mMap = MarkedMap.create.bind(MarkedMap);
export const mValue = MarkedValue.create.bind(MarkedValue);

export { subbable } from "./lib/Subbable";
