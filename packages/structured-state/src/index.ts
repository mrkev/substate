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
  map,
  set,
} from "./sstate";

export { create, Struct } from "./Struct";
export { Struct2, create2 } from "./Struct2";
export { Structured } from "./Structured";
export type { DeserializeFunc } from "./Structured";
export type { StructProps } from "./Struct";

export { LinkedMap as SMap } from "./lib/state/LinkedMap";
export { LinkedSet as SSet } from "./lib/state/LinkedSet";
export { LinkedPrimitive as SPrimitive } from "./lib/state/LinkedPrimitive";

export { useNewLinkedMap, useNewLinkedSet } from "./lib/state/useNew";

export { debugOut } from "./sstate.debug";
export { getGlobalState, history } from "./sstate.history";
export {
  useContainer,
  useStructure as useContainerWithSetter,
  useSPrimitive as usePrimitive,
} from "./sstate.react";
export { construct, serialize } from "./serialization";
