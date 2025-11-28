import { MarkedArray } from "./src/MarkedArray";
import { MarkedMap } from "./src/MarkedMap";
import { MarkedSet } from "./src/MarkedSet";

export { MarkedArray } from "./src/MarkedArray";
export { MarkedMap } from "./src/MarkedMap";
export { MarkedSet } from "./src/MarkedSet";

export {
  //
  useLink,
} from "./src/hooks";

export const mSet = MarkedSet.create.bind(MarkedSet);
export const mArray = MarkedArray.create.bind(MarkedArray);
export const mMap = MarkedArray.create.bind(MarkedMap);
