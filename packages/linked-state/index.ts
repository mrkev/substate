import { LinkableArray } from "./src/LinkableArray";
import { LinkableMap } from "./src/LinkableMap";
import { LinkableSet } from "./src/LinkableSet";
import { LinkableValue } from "./src/LinkableValue";

export { LinkableArray } from "./src/LinkableArray";
export { LinkableMap } from "./src/LinkableMap";
export { LinkableSet } from "./src/LinkableSet";
export { LinkableValue } from "./src/LinkableValue";

export {
  //
  useLink,
  useLinkAsState,
} from "./src/hooks";

export const lValue = LinkableValue.create.bind(LinkableValue);
export const lArray = LinkableArray.create.bind(LinkableArray);
export const lMap = LinkableMap.create.bind(LinkableMap);
export const lSet = LinkableSet.create.bind(LinkableSet);
