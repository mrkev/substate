import { SSet, StructuredKind } from ".";
import { LinkedArray } from "./state/LinkedArray";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSchemaArray } from "./state/SSchemaArray";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { StructSchema } from "./StructuredKinds";
import { SUnion } from "./sunion";

export function assertSPrimitive<T>(
  value: unknown,
): asserts value is LinkedPrimitive<any> {
  if (!(value instanceof LinkedPrimitive)) {
    console.log("ERR:", value, "to be primitive");
    throw new Error("not an sprimitive"); // assertion error
  }
}

export function assertSSimpleArray<T>(
  value: unknown,
): asserts value is LinkedArray<any> {
  if (!(value instanceof LinkedArray)) {
    console.log("ERR:", value, "to be sarray");
    throw new Error("not an sarray"); // assertion error
  }
}

export function assertSSchemaArray<T>(
  value: unknown,
): asserts value is SSchemaArray<any> {
  if (!(value instanceof SSchemaArray)) {
    console.log("ERR:", value, "to be sschemaarray");
    throw new Error("not an sschemaarray"); // assertion error
  }
}

export function assertStruct<T>(value: unknown): asserts value is Struct<any> {
  if (!(value instanceof Struct)) {
    console.log("ERR:", value, "to be struct");
    throw new Error("not a struct"); // assertion error
  }
}

export function assertStruct2<T>(
  value: unknown,
): asserts value is Struct2<any> {
  if (!(value instanceof Struct2)) {
    console.log("ERR:", value, "to be struct2");
    throw new Error("not a struct2"); // assertion error
  }
}

export function assertStructured<T>(
  value: unknown,
): asserts value is Structured<any, any> {
  if (!(value instanceof Structured)) {
    console.log("ERR:", value, "to be structured");
    throw new Error("not a Structured"); // assertion error
  }
}

export function assertSSet<T>(value: unknown): asserts value is SSet<T> {
  if (!(value instanceof SSet)) {
    console.log("ERR:", value, "to be sset");
    throw new Error("not a SSet"); // assertion error
  }
}

export function assertSUnion<T extends StructuredKind>(
  value: unknown,
): asserts value is SUnion<T> {
  if (!(value instanceof SUnion)) {
    console.log("ERR:", value, "to be sunion");
    throw new Error("not a SUnion"); // assertion error
  }
}

export function exhaustive(x: never, msg?: string): never {
  throw new Error(msg ?? `Exhaustive violation, unexpected value ${x}`);
}

export function assertArray<T>(
  val: Array<T> | unknown,
): asserts val is Array<T> {
  if (!Array.isArray(val)) {
    throw new Error(`not an array`);
  }
}

export function assertNotArray<T>(val: Array<T> | T): asserts val is T {
  if (Array.isArray(val)) {
    throw new Error(`is an array`);
  }
}

export function assertConstructableStruct(
  spec: StructSchema,
): asserts spec is typeof Struct {
  if (spec instanceof Struct) {
    throw new Error(`is not a Struct`);
  }
}

export function assertConstructableStruct2(
  spec: StructSchema,
): asserts spec is typeof Struct2 {
  if ((spec as any).__proto__ !== Struct2) {
    throw new Error(`is not a Struct2`);
  }
}

export function assertConstructableStructured(
  spec: StructSchema | typeof Structured,
): asserts spec is typeof Structured {
  if ((spec as any).__proto__ !== Structured) {
    throw new Error(`is not a Structured`);
  }
}

export function assertConstructableObj(
  spec: StructSchema,
): asserts spec is StructSchema {
  if (
    (spec as any).__proto__ === Structured ||
    (spec as any).__proto__ === Struct2 ||
    (spec as any).__proto__ === Struct
  ) {
    throw new Error(`is not a constructable object`);
  }
}
