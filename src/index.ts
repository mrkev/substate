export {
  SArray,
  SBoolean,
  SNil,
  SNumber,
  SSchemaArray,
  SString,
  array,
  arrayOf,
  boolean,
  nil,
  number,
  string,
} from "./sstate";

export { create, Struct } from "./Struct";

export { Struct2, create2 } from "./Struct2";
export { Structured } from "./Structured";
export type { DeserializeFunc } from "./Structured";

export { LinkedPrimitive as SPrimitive } from "./lib/state/LinkedPrimitive";
export type { StructProps } from "./Struct";
export { debugOut } from "./sstate.debug";
export { getGlobalState, history } from "./sstate.history";
export {
  useContainer,
  useStructure as useContainerWithSetter,
  useSPrimitive as usePrimitive,
} from "./sstate.react";
export { construct, serialize } from "./sstate.serialization";
