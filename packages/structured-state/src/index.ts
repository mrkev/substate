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

export { create, Struct } from "./obj/Struct";
export type { StructProps } from "./obj/Struct";
export { create2, Struct2 } from "./obj/Struct2";
export { Structured } from "./obj/Structured";
export type { DeserializeFunc, JSONOfAuto } from "./obj/Structured";

export { LinkedArray as SArray } from "./obj/LinkedArray";
export { LinkedMap as SMap } from "./obj/LinkedMap";
export { LinkedPrimitive as SPrimitive } from "./obj/LinkedPrimitive";
export { SSet } from "./obj/LinkedSet";
export { SSchemaArray } from "./obj/SSchemaArray";

export { useNewLinkedMap, useNewLinkedSet } from "./react/useNew";

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
} from "./react/hooks";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization/initialize";
export type { PrimitiveKind, StructuredKind } from "./state/StructuredKinds";

export const simplify = {
  structured: simplifyStructured,
};
