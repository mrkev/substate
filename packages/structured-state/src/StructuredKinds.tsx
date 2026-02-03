import { SSet, Structured } from ".";
import { SSchemaArray } from "./state/SSchemaArray";
import { LinkedArray } from "./state/LinkedArray";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { ConstructableStructure } from "./Structured";
import { SUnion } from "./sunion";

export type PrimitiveKind = number | string | boolean | null;

export function isPrimitiveKind(val: unknown) {
  return (
    typeof val === "number" ||
    typeof val === "string" ||
    typeof val === "boolean" ||
    val === null
  );
}

// was KnowableObject before
export type StructuredKind =
  | LinkedPrimitive<any>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>
  | LinkedArray<any>
  | SSchemaArray<any>
  | SSet<any>
  | SUnion<any>;

export type StructuredKindConstructor =
  | typeof LinkedPrimitive<any>
  | typeof Struct<any>
  | typeof Struct2<any>
  | ConstructableStructure<any>
  | typeof LinkedArray<any>
  | typeof SSchemaArray<any>
  | typeof SSet<any>
  | typeof SUnion<any>;

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
    val instanceof LinkedArray ||
    val instanceof SSchemaArray ||
    val instanceof SSet ||
    val instanceof SUnion
  );
}
