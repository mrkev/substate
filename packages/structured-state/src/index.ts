import { simplifyStructured } from "./serialization/simplify";

export {
  array,
  arrayOf,
  boolean,
  map,
  nil,
  number,
  SBoolean,
  set,
  SNil,
  SNumber,
  SString,
  string,
} from "./sstate";

export { create, Struct } from "./Struct";
export type { StructProps } from "./Struct";
export { create2, Struct2 } from "./Struct2";
export { Structured } from "./Structured";
export type { DeserializeFunc, JSONOfAuto } from "./Structured";

export { SArray, SSchemaArray } from "./SArray";
export { LinkedMap as SMap } from "./state/LinkedMap";
export { LinkedPrimitive as SPrimitive } from "./state/LinkedPrimitive";
export { SSet } from "./state/LinkedSet";

export { useNewLinkedMap, useNewLinkedSet } from "./state/useNew";

export type { ReplaceFunctions } from "./serialization/replace";
export { serialize } from "./serialization/serialization";
export type { S } from "./serialization/serialization";
export { construct } from "./serialization/construct";
export { debugOut } from "./debug.text";
export { debugOutHtml } from "./debug.html";
export { DebugOut } from "./debug.react";

export { getGlobalState, history } from "./sstate.history";
export { useContainer, useSPrimitive as usePrimitive } from "./sstate.react";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

export { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization/initialize";
export type { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export const simplify = {
  structured: simplifyStructured,
};
