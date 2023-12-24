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

export { Struct2, create2 } from "./Struct2";

export { getGlobalState, history } from "./sstate.history";
export type { StructProps } from "./sstate";
export { LinkedPrimitive as SPrimitive } from "./lib/state/LinkedPrimitive";
export { debugOut } from "./sstate.debug";
export {
  useContainer,
  useSPrimitive as usePrimitive,
  useStructure as useContainerWithSetter,
} from "./sstate.react";
export { construct, serialize } from "./sstate.serialization";
