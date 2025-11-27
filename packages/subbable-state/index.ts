import { MarkedArray } from "./src/MarkedArray";
import { MarkedSet } from "./src/MarkedSet";

export { MarkedArray } from "./src/MarkedArray";
export { MarkedSet } from "./src/MarkedSet";

export {
  //
  useLink,
} from "./src/hooks";

export const lSet = MarkedSet.create.bind(MarkedSet);
export const lArray = MarkedArray.create.bind(MarkedArray);
