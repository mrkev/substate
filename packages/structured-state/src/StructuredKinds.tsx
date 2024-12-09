import { SSet, Structured } from ".";
import { SArray, SSchemaArray } from "./SArray";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { ConstructableStructure } from "./Structured";
import { SUnion } from "./sunion";

export type PrimitiveKind = number | string | boolean | null;

// was KnowableObject before
export type StructuredKind =
  | LinkedPrimitive<any>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>
  | SArray<any>
  | SSchemaArray<any>
  | SSet<any>
  | SUnion<any>;

export type StructuredStructureKind =
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>;

export type StructSchema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | ConstructableStructure<any>;

export function isStructuredKind(val: unknown) {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof Struct ||
    val instanceof Struct2 ||
    val instanceof Structured ||
    val instanceof SArray ||
    val instanceof SSchemaArray ||
    val instanceof SSet ||
    val instanceof SUnion
  );
}
