import {
  replacePrimitive,
  replaceSchemaArray,
  replaceSimpleArray,
  replaceSSet,
  replaceStructured,
} from "./serializaiton.replace";
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

export { construct, serialize } from "./serialization";
export type { S } from "./serialization";
export { debugOut } from "./sstate.debug";
export { getGlobalState, history } from "./sstate.history";
export {
  useContainer,
  useStructure as useContainerWithSetter,
  useSPrimitive as usePrimitive,
} from "./sstate.react";

export { DirtyObserver, useDirtyTracker } from "./DirtyObserver";
export type { DirtyState } from "./DirtyObserver";

// export { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";

// export { init } from "./serialization.initialize";
export type { InitFunctions } from "./serialization.initialize";
export type { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export const replace = {
  string: replacePrimitive<string>,
  number: replacePrimitive<number>,
  boolean: replacePrimitive<boolean>,
  null: replacePrimitive<null>,
  primitive: replacePrimitive,
  schemaArray: replaceSchemaArray, // todo: test
  array: replaceSimpleArray,
  // struct: initializeStruct,
  // struct2: initializeStruct2,
  structured: replaceStructured,
  set: replaceSSet,
} as const;

export const simplify = {
  structured: simplifyStructured,
};
