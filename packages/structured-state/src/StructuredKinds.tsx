import { SSet, Structured } from ".";
import { SArray, SSchemaArray } from "./sstate";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";

export type PrimitiveKind = number | string | boolean | null;

export type StructuredKind =
  | LinkedPrimitive<any>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any, any>
  | SArray<any>
  | SSchemaArray<any>
  | SSet<any>;

export function isStructuredKind(val: unknown) {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof Struct ||
    val instanceof Struct2 ||
    val instanceof Structured ||
    val instanceof SArray ||
    val instanceof SSchemaArray
  );
}
