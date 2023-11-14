import { SArray, SSchemaArray, Struct } from "./sstate";
import { SPrimitive } from "./lib/state/LinkedState";

export function assertSPrimitive<T>(
  value: unknown
): asserts value is SPrimitive<any> {
  if (!(value instanceof SPrimitive)) {
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
