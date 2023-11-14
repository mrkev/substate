export {
  SArray,
  SSchemaArray,
  SBoolean,
  SNil,
  SNumber,
  SString,
  Struct,
  array,
  arrayOf,
  boolean,
  create,
  nil,
  number,
  string,
} from "./sstate";

export {
  getGlobalState,
  pushHistory,
  popHistory as undo,
} from "./sstate.history";
export type { StructProps } from "./sstate";
export { debugOut } from "./sstate.debug";
export {
  useContainer,
  useSPrimitive as usePrimitive,
  useStructure,
} from "./sstate.react";
export { construct, serialize } from "./sstate.serialization";
