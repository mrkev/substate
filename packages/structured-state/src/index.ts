import { simplifyStructured } from "./serialization/simplify";

export {
  array,
  arrayOf,
  boolean,
  map,
  nil,
  number,
  set,
  string,
} from "./sstate";

export { SBoolean, SNil, SNumber, SString } from "./sstate";

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

export { debugOutHtml } from "./debug.html";
export { DebugOut } from "./debug.react";
export { debugOut as debugOutText } from "./debug.text";
export { construct } from "./serialization/construct";
export type { ReplaceFunctions } from "./serialization/replace";
export { serialize } from "./serialization/serialization";
export type { S } from "./serialization/serialization";

export { getGlobalState, history } from "./sstate.history";
export { useContainer, usePrimitive as usePrimitive } from "./state/hooks";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

export { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization/initialize";
export type { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export const simplify = {
  structured: simplifyStructured,
};
