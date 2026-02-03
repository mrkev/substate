import { simplifyStructured } from "./serialization/simplify";

export {
  array,
  arrayOf,
  boolean,
  map,
  nil,
  number,
  primitive,
  set,
  string,
} from "./sstate";

export { SBoolean, SNil, SNumber, SString } from "./sstate";

export { create, Struct } from "./Struct";
export type { StructProps } from "./Struct";
export { create2, Struct2 } from "./Struct2";
export { Structured } from "./Structured";
export type { DeserializeFunc, JSONOfAuto } from "./Structured";

export { LinkedArray as SArray } from "./state/LinkedArray";
export { LinkedMap as SMap } from "./state/LinkedMap";
export { LinkedPrimitive as SPrimitive } from "./state/LinkedPrimitive";
export { SSet } from "./state/LinkedSet";
export { SSchemaArray } from "./state/SSchemaArray";

export { useNewLinkedMap, useNewLinkedSet } from "./state/useNew";

export { debugOutHtml } from "./debug.html";
export { DebugOut } from "./debug.react";
export { debugOut as debugOutText } from "./debug.text";
export { construct } from "./serialization/construct";
export type { ReplaceFunctions } from "./serialization/replace";
export { serialize } from "./serialization/serialization";
export type { S } from "./serialization/serialization";

export { getGlobalState, history } from "./sstate.history";
export {
  useContainer,
  usePrimitive,
  useSubscribeToSubbableMutationHashable,
} from "./state/hooks";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization/initialize";
export type { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export const simplify = {
  structured: simplifyStructured,
};
