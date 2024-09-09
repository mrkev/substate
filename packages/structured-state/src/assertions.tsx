import { SArray, SSchemaArray } from "./sstate";
import { Struct } from "./Struct";
import { LinkedPrimitive } from "../state/LinkedPrimitive";
import { LinkedArray } from "../state/LinkedArray";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { LinkedSet } from "../state/LinkedSet";
import { SSet } from ".";

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

export function assertStructured<T>(
  value: unknown
): asserts value is Structured<any, any> {
  if (!(value instanceof Structured)) {
    throw new Error("not a Structured"); // assertion error
  }
}

export function assertSSet<T>(value: unknown): asserts value is SSet<T> {
  if (!(value instanceof SSet)) {
    throw new Error("not a SSet"); // assertion error
  }
}

export function exhaustive(x: never, msg?: string): never {
  throw new Error(msg ?? `Exhaustive violation, unexpected value ${x}`);
}

export type Containable =
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>;

export function isContainable(
  val: unknown
): val is
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>
  | LinkedSet<unknown> {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof LinkedArray ||
    val instanceof Struct ||
    val instanceof Struct2 ||
    val instanceof Structured ||
    val instanceof LinkedSet
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

export function assertConstructableStruct(
  spec: typeof Struct | typeof Struct2 | typeof Structured
): asserts spec is typeof Struct {
  if (spec instanceof Struct) {
    throw new Error(`is not a Struct`);
  }
}

export function assertConstructableStruct2(
  spec: typeof Struct | typeof Struct2 | typeof Structured
): asserts spec is typeof Struct2 {
  if ((spec as any).__proto__.name !== "Struct2") {
    throw new Error(`is not a Struct2`);
  }
}

export function assertConstructableStructured(
  spec: typeof Struct | typeof Struct2 | typeof Structured
): asserts spec is typeof Structured {
  if ((spec as any).__proto__.name !== "Structured") {
    throw new Error(`is not a Structured`);
  }
}

export function assertConstructableObj(
  spec: typeof Struct | typeof Struct2 | typeof Structured
): asserts spec is typeof Structured | typeof Struct | typeof Struct2 {
  if (
    (spec as any).__proto__.name === "Structured" ||
    (spec as any).__proto__.name === "Struct2" ||
    (spec as any).__proto__.name === "Struct"
  ) {
    throw new Error(`is not a constructable object`);
  }
}
