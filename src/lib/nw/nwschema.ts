import { NWConsumeResult, NWOut } from "./nwschema.types";
import * as sub from "./subschema";
import { SubSchema } from "./subschema";
import { SubIn } from "./subschema.types";
import { isRecord } from "./utils";

function success<T>(value: T): { status: "success"; value: T } {
  return { status: "success", value };
}

function failure(msg?: string): { status: "failure"; error: Error } {
  return { status: "failure", error: new Error(msg) };
}

type AllNWs =
  | NWString
  | NWNumber
  | NWBoolean
  | NWNil
  | NWUnion<any>
  | NWMap<any>
  | NWArray<any>
  | NWObject<any>;

// SubArray<SubNumber> -> number[] (default never)
export type NWSpecify<T extends NWSchema<unknown>> = T extends NWSchema<number>
  ? NWNumber
  : T extends NWSchema<string>
  ? NWString
  : T extends NWSchema<boolean>
  ? NWBoolean
  : T extends NWSchema<infer O>
  ? O extends Record<string, NWSchema<unknown>>
    ? NWObject<{
        [Key in keyof O]: NWSpecify<O[Key]>;
      }>
    : never
  : // : T extends SubUnion<infer U>
    // ? SubOut<U>
    // : T extends SubMap<infer V>
    // ? { [key: string]: SubOut<V> }
    // : T extends SubNil
    // ? null
    // : T extends SubArray<infer E>
    // ? SubOut<E>[]
    never;

//////// Schema ////////

export interface NWSchema<T> {
  // concretize(val: T): SubSchema<T>;
  consume(val: unknown): NWConsumeResult<T>;
}

/** Describes a string */
class NWString implements NWSchema<string> {
  concretize(val: string): sub.SubString {
    return sub.string(val);
  }

  expect(val: unknown): string {
    if (typeof val === "string") {
      return val;
    } else {
      throw new Error(`Unexpected value ${val}. Expected string.`);
    }
  }

  consume(val: unknown): NWConsumeResult<string> {
    if (typeof val === "string") {
      return success<string>(val);
    } else {
      return failure();
    }
  }
}

/** Describes a number */
class NWNumber implements NWSchema<number> {
  concretize(val: number): sub.SubNumber {
    return sub.number(val);
  }

  expect(val: unknown): number {
    if (typeof val === "number") {
      return val;
    } else {
      throw new Error(`Unexpected value ${val}. Expected number.`);
    }
  }

  consume(val: unknown): NWConsumeResult<number> {
    if (typeof val === "number") {
      return success<number>(val);
    } else {
      return failure();
    }
  }
}

/** Describes a boolean */
class NWBoolean implements NWSchema<boolean> {
  concretize(val: boolean): sub.SubBoolean {
    return sub.boolean(val);
  }

  expect(val: unknown): boolean {
    if (typeof val === "boolean") {
      return val;
    } else {
      throw new Error(`Unexpected value ${val}. Expected boolean.`);
    }
  }

  consume(val: unknown): NWConsumeResult<boolean> {
    if (typeof val === "boolean") {
      return success<boolean>(val);
    } else {
      return failure();
    }
  }
}

/** Describes null, undefined, void */
class NWNil implements NWSchema<null> {
  concretize(val: null): sub.SubNil {
    return sub.nil(val);
  }

  expect(val: unknown): null {
    if (val === null) {
      return val;
    } else {
      throw new Error(`Unexpected value ${val}. Expected null.`);
    }
  }

  consume(val: unknown): NWConsumeResult<null> {
    if (val == null) {
      return success(null);
    } else {
      return failure();
    }
  }
}

/** Describes a union of several types; resolves to the first successful one */
class NWUnion<T extends NWSchema<any>> implements NWSchema<NWOut<T>> {
  private options: T[];
  constructor(options: T[]) {
    this.options = options;
  }

  concretize(val: NWOut<T>): sub.SubUnion<SubIn<NWOut<T>>> {
    // concretize(val: NWOut<T>): sub.SubUnion<NWUnionOptsToSubOpts<T>> {

    for (const option of this.options) {
      const result = option.consume(val);
      if (result.status === "success") {
        // if (option instanceof NWNumber) {
        //   const concretizedOption = (option as NWNumber).concretize(val as any);
        //   return sub.union(concretizedOption, this);
        // }

        const concretizedOption = sub.concretize(option as any, val as any);
        // const concretizedOption = option.concretize(val);
        return sub.union(concretizedOption as any, this) as any; // TODO
      }
    }

    throw new Error("CAN NOT CONCRETIZE");
  }

  consume(val: unknown): NWConsumeResult<NWOut<T>> {
    for (const schema of this.options) {
      const result = schema.consume(val);
      if (result.status === "success") {
        return result;
      }
    }
    return failure();
  }
}

export type ValueForObjectSchema<T extends Record<string, NWSchema<unknown>>> =
  {
    [Key in keyof T]: NWOut<T[Key]>;
  };

// TODO: consume null values, since they won't even show up.
/** Describes an object with known keys */
class NWObject<T extends Record<string, NWSchema<unknown>>>
  implements NWSchema<{ [Key in keyof T]: NWOut<T[Key]> }>
{
  private schema: T;
  constructor(schema: T) {
    this.schema = schema;
  }

  create(val: ValueForObjectSchema<T>): sub.SubObject<{
    [Key in keyof T]: SubIn<NWOut<T[Key]>>;
  }> {
    return this.concretize(val);
  }

  // SubSchema<Record<string, NWOut<T>>> {
  concretize(val: ValueForObjectSchema<T>): sub.SubObject<{
    [Key in keyof T]: SubIn<NWOut<T[Key]>>;
  }> {
    const concretizedEntries = Object.entries(val).map(([key, value]) => {
      const schema = this.schema[key];
      if (schema instanceof NWArray) {
        return [key, schema.concretize(value)];
      }
      return [key, sub.concretize(this.schema[key] as any, value)];
    });
    const concretizedRecord = Object.fromEntries(concretizedEntries);
    const result = sub.object(concretizedRecord, this as any);
    return result as any; // TODO: as any
  }

  consume(obj: unknown): NWConsumeResult<{ [Key in keyof T]: NWOut<T[Key]> }> {
    if (!isRecord(obj)) {
      return failure();
    }

    const consumedKeys = new Set<string>();
    // First, iterate all keys in the object. Will find unexpected keys.
    for (const key in obj) {
      const val = obj[key];
      const valSchema = this.schema[key];
      if (!valSchema) {
        return failure(`unexpected key ${key} found.`); // todo, maybe warn instead and continue? make an extensible object, and another that's exact?
      }

      const result = valSchema.consume(val);
      if (result.status === "failure") {
        return failure(result.error.message);
      }

      consumedKeys.add(key);
    }

    // Next, iterate all keys in the schema. Will find missing keys.
    for (const key in this.schema) {
      if (consumedKeys.has(key)) continue;
      const valSchema = this.schema[key];
      // consuming 'undefined' is exactly what we want here
      const result = valSchema.consume(obj[key]);
      if (result.status === "failure") {
        return failure(result.error.message);
      }
    }

    // We clone the object, cause we'll set default values and whatnot, and we don't want to edit the origianl
    // TODO: triple check consumption, since we have to cast
    return success({ ...obj } as any);
  }
}

class NWMap<T extends NWSchema<unknown>>
  implements NWSchema<Record<string, NWOut<T>>>
{
  private valSchema: T;
  constructor(valSchema: T) {
    this.valSchema = valSchema;
  }

  // or sub.SubMap<sub.SubInLax<NWOut<T>>>??
  concretize(
    val: Record<string, NWOut<T>>
    // TODO: sub.SubMap
  ): SubSchema<Record<string, NWOut<T>>> {
    const concretizedEntries = Object.entries(val).map(
      ([key, value]) =>
        [key, (this.valSchema as any).concretize(value)] as const
    );
    const concretizedRecord = Object.fromEntries(concretizedEntries);
    const result = sub.map(concretizedRecord, this);
    return result as any;
  }

  consume(obj: unknown): NWConsumeResult<Record<string, NWOut<T>>> {
    if (!isRecord(obj)) {
      return failure();
    }

    for (const key in obj) {
      const val = obj[key];
      const result = this.valSchema.consume(val);
      if (result.status === "failure") {
        return failure(result.error.message);
      }
    }

    return success({ ...obj } as any);
  }
}

/** Describes an array */
class NWArray<T extends NWSchema<unknown>> implements NWSchema<NWOut<T>[]> {
  private readonly schema: T;
  constructor(schema: T) {
    this.schema = schema;
  }

  expect(arr: unknown): NWOut<T>[] {
    if (!Array.isArray(arr)) {
      throw new Error(`Unexpected value ${arr}. Expected array.`);
    }

    for (const value of arr) {
      const result = this.schema.consume(value);
      if (result.status === "failure") {
        throw new Error(`Unexpected value in array ${arr}: ${value}.`);
      }
    }

    // we clone since we might want to modify the arrow with defaults
    return [...arr];
  }

  concretize(val: NWOut<T>[]): SubSchema<NWOut<T>[]> {
    const concretizedItems = val.map((item) =>
      (this.schema as any).concretize(item)
    );
    const result = sub.array<SubSchema<unknown>>(concretizedItems, this);
    return result;
  }

  consume(arr: unknown): NWConsumeResult<NWOut<T>[]> {
    if (!Array.isArray(arr)) {
      return failure();
    }

    for (const value of arr) {
      const result = this.schema.consume(value);
      if (result.status === "failure") {
        return failure(result.error.message);
      }
    }

    // we clone since we might want to modify the arrow with defaults
    return success([...arr]);
  }
}

function string() {
  return new NWString();
}

function number() {
  return new NWNumber();
}

function boolean() {
  return new NWBoolean();
}

function nil() {
  return new NWNil();
}

function union<T extends Array<NWSchema<unknown>>>(
  ...args: T
): NWUnion<T[number]> {
  return new NWUnion<T[number]>(args);
}

function array<T extends NWSchema<unknown>>(schema: T): NWArray<T> {
  return new NWArray(schema);
}

function object<T extends Record<string, NWSchema<unknown>>>(
  schema: T
): NWObject<T> {
  return new NWObject<T>(schema);
}

function map<T extends NWSchema<unknown>>(map: {
  "[key: string]": T;
}): NWMap<T> {
  return new NWMap(map["[key: string]"]);
}

export {
  NWArray,
  NWBoolean,
  NWMap,
  NWNil,
  NWNumber,
  NWObject,
  NWString,
  NWUnion,
  array,
  boolean,
  map,
  nil,
  number,
  object,
  string,
  union,
};
export type infer<T extends NWSchema<unknown>> = NWOut<T>;
