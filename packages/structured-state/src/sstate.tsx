//////// Schema ////////

import { nanoid } from "nanoid";
import { SArray, SSchemaArray } from "./SArray";
import { StructSchema } from "./StructuredKinds";
import { LinkedMap } from "./state/LinkedMap";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { JSONValue } from "./lib/types";

// todo? create -> of
export class SString extends LinkedPrimitive<string> {
  static create(val: string) {
    return LinkedPrimitive.of(val);
  }
}
export class SNumber extends LinkedPrimitive<number> {
  static create(val: number) {
    return LinkedPrimitive.of(val);
  }
}
export class SBoolean extends LinkedPrimitive<boolean> {
  static create(val: boolean) {
    return LinkedPrimitive.of(val);
  }
}
export class SNil extends LinkedPrimitive<null> {
  static create(val: null) {
    return LinkedPrimitive.of(val);
  }
}

export class UNINITIALIZED_PRIMITIVE {}
export class UNINITIALIZED_ARRAY {}
export class UNINITIALIZED_TYPED_ARRAY<S extends StructSchema> {
  schema: S;
  constructor(schema: S) {
    this.schema = schema;
  }
}

export type SOut<T> = T extends SNumber
  ? number
  : T extends SString
  ? string
  : T extends SBoolean
  ? boolean
  : T extends SNil
  ? null
  : T extends SArray<infer O>
  ? O[]
  : // ? {
    //     [Key in keyof O]: NWOut<O[Key]>;
    //   }
    never;

////////////// CREATION FUNCTIONS //////////////

export function string(value?: string): SString {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SString.of(value);
}

export function number(value?: number): SNumber {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SNumber.of(value);
}

export function boolean(value?: boolean): SBoolean {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SBoolean.of(value);
}

export function nil(): SNil {
  return SNil.of(null);
}

export function arrayOf<T extends StructSchema>(
  schema: T[],
  val?: InstanceType<T>[]
): SSchemaArray<InstanceType<T>> {
  return val == null
    ? (new UNINITIALIZED_TYPED_ARRAY(schema as any) as any)
    : new SSchemaArray(val, nanoid(5), schema);
}

export function array<T extends JSONValue>(val?: T[]): SArray<T> {
  return val == null
    ? (new UNINITIALIZED_ARRAY() as any)
    : new SArray(val, nanoid(5));
}

export function map<K, V>(initialValue?: Map<K, V>) {
  return LinkedMap.create(initialValue);
}

export function set<T>(initialValue?: Iterable<T>) {
  return SSet._create(initialValue);
}

export function setOf<T extends StructSchema>(
  schema: T,
  initialValue?: Iterable<InstanceType<T>>
) {
  return SSet._create(initialValue, undefined, schema);
}
