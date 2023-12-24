import { SArray, SSchemaArray, Struct } from "./sstate";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { LinkedArray } from "./lib/state/LinkedArray";
import { Struct2 } from "./Struct2";

export function assertSPrimitive<T>(
  value: unknown
): asserts value is LinkedPrimitive<any> {
  if (!(value instanceof LinkedPrimitive)) {
    throw new Error("not an sprimitive"); // assertion error
  }
}

export function assertSSimpleArray<T>(
  value: unknown
): asserts value is SArray<any> {
  if (!(value instanceof SArray)) {
    throw new Error("not an sarray"); // assertion error
  }
}

export function assertSSchemaArray<T>(
  value: unknown
): asserts value is SSchemaArray<any> {
  if (!(value instanceof SSchemaArray)) {
    throw new Error("not an sschemaarray"); // assertion error
  }
}

export function assertStruct<T>(value: unknown): asserts value is Struct<any> {
  if (!(value instanceof Struct)) {
    throw new Error("not a struct"); // assertion error
  }
}

export function assertStruct2<T>(
  value: unknown
): asserts value is Struct2<any> {
  if (!(value instanceof Struct2)) {
    throw new Error("not a struct2"); // assertion error
  }
}

export function exhaustive(x: never, msg?: string): never {
  throw new Error(msg ?? `Exhaustive violation, unexpected value ${x}`);
}

export function isContainable(
  val: unknown
): val is
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | Struct<any>
  | Struct2<any> {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof LinkedArray ||
    val instanceof Struct ||
    val instanceof Struct2
  );
}

export function assertArray<T>(
  val: Array<T> | unknown
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

export function assertConstructableStruct<T>(
  spec: typeof Struct | typeof Struct2
): asserts spec is typeof Struct {
  if (spec instanceof Struct) {
    throw new Error(`is not a Struct`);
  }
}

export function assertConstructableStruct2<T>(
  spec: typeof Struct | typeof Struct2
): asserts spec is typeof Struct2 {
  if ((spec as any).__proto__.name !== "Struct2") {
    throw new Error(`is not a Struct2`);
  }
}
