export {
  SBoolean,
  SNil,
  SNumber,
  SString,
  SArray,
  Struct,
  array,
  boolean,
  nil,
  number,
  string,
  create,
} from "./sstate";

export type { StructProps } from "./sstate";

export { debugOut } from "./sstate.debug";
export { globalState, popHistory as undo, pushHistory } from "./sstate.history";
export {
  useStructure,
  useContainer,
  useSPrimitive as usePrimitive,
} from "./sstate.react";
export { construct, serialize } from "./sstate.serialization";
