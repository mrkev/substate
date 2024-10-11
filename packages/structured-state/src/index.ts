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

export { LinkedMap as SMap } from "./state/LinkedMap";
export { SSet } from "./state/LinkedSet";
export { LinkedPrimitive as SPrimitive } from "./state/LinkedPrimitive";

export { useNewLinkedMap, useNewLinkedSet } from "./state/useNew";

export { debugOut } from "./sstate.debug";
export { getGlobalState, history } from "./sstate.history";
export {
  useContainer,
  useStructure as useContainerWithSetter,
  useSPrimitive as usePrimitive,
} from "./sstate.react";
export { construct, serialize } from "./serialization";
export type { S } from "./serialization";

export { useDirtyTracker, DirtyObserver } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

// TODO: eventually remove
export { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";

export type { StructuredKind, PrimitiveKind } from "./StructuredKinds";
export { init } from "./serialization.initialize";
