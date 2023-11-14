import { SArray, SSchemaArray, Struct } from "./sstate";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { LinkedArray } from "./lib/state/LinkedArray";

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

export function exhaustive(x: never): never {
  throw new Error(`Exhaustive violation, unexpected value ${x}`);
}

export function isContainable(
  val: unknown
): val is LinkedPrimitive<unknown> | LinkedArray<unknown> | Struct<any> {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof LinkedArray ||
    val instanceof Struct
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
