import { SSet, Structured } from ".";
import { Struct2 } from "./Struct2";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SArray, SSchemaArray } from "./sstate";
import { Struct } from "./Struct";

export type StructuredKinds =
  | SArray<any>
  | SSchemaArray<any>
  | SSet<any>
  | LinkedPrimitive<any>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>;
