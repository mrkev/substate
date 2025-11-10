import { LinkableArray } from "./LinkableArray";
import { LinkableMap } from "./LinkableMap";
import { LinkableSet } from "./LinkableSet";
import { LinkableValue } from "./LinkableValue";

export { LinkableArray as LinkableArray } from "./LinkableArray";
export { LinkableMap as LinkableMap } from "./LinkableMap";
export { LinkableValue as LinkablePrimitive } from "./LinkableValue";
export { LinkableSet as LinkableSet } from "./LinkableSet";

export {
  //
  useLink,
  useLinkAsState,
} from "./hooks";

export {
  //
  useNewLinkedArray,
  useNewLinkedMap,
  useNewLinkedSet,
} from "./useNew";

export const lValue = LinkableValue.create.bind(LinkableValue);
export const lArray = LinkableArray.create.bind(LinkableArray);
export const lMap = LinkableMap.create.bind(LinkableMap);
export const lSet = LinkableSet.create.bind(LinkableSet);
