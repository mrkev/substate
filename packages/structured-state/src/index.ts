import { simplifyStructured } from "./serialization.simplify";

export {
  array,
  arrayOf,
  boolean,
  map,
  nil,
  number,
  SArray,
  SBoolean,
  set,
  SNil,
  SNumber,
  SSchemaArray,
  SString,
  string,
} from "./sstate";

export { create, Struct } from "./Struct";
export type { StructProps } from "./Struct";
export { create2, Struct2 } from "./Struct2";
export { Structured } from "./Structured";
export type { DeserializeFunc, JSONOfAuto } from "./Structured";

export { LinkedMap as SMap } from "./state/LinkedMap";
export { LinkedPrimitive as SPrimitive } from "./state/LinkedPrimitive";
export { SSet } from "./state/LinkedSet";

export { useNewLinkedMap, useNewLinkedSet } from "./state/useNew";

export type { ReplaceFunctions } from "./serializaiton.replace";
export { serialize } from "./serialization";
export { construct } from "./serialization.construct";
export type { S } from "./serialization";
export { debugOut } from "./sstate.debug";
export { getGlobalState, history } from "./sstate.history";
export { useContainer, useSPrimitive as usePrimitive } from "./sstate.react";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

export { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization.initialize";
export type { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export const simplify = {
  structured: simplifyStructured,
};
