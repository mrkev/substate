import { initialize } from "./serialization.initialize";
import { simplify } from "./serialization.simplify";
import { SArray, SSchemaArray, SState } from "./sstate";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { StructuredKind } from "./StructuredKinds";

// TODO: map

export type SerializedDescriptor = Record<
  string,
  Serialized | string | number | boolean | null
>;

export type SerializedTypePrimitive<T> = Readonly<{
  $$: "prim";
  _id: string;
  _value: T;
}>;

export type SerializedSimpleArray<T> = Readonly<{
  $$: "arr-simple";
  _id: string;
  _value: readonly T[];
}>;

export type NSerialized = {
  prim: Readonly<{
    $$: "prim";
    _id: string;
    _value: unknown;
  }>;
  "arr-schema": Readonly<{
    $$: "arr-schema";
    _id: string;
    _value: (Serialized | unknown)[];
  }>;
  "arr-simple": Readonly<{
    $$: "arr-simple";
    _id: string;
    _value: readonly unknown[];
  }>;
  struct: Readonly<{
    $$: "struct";
    _id: string;
    _value: {
      [key: string]: Serialized | unknown;
    };
  }>;
  struct2: Readonly<{
    $$: "struct2";
    _id: string;
    _value: readonly unknown[];
  }>;
  structured: Readonly<{
    $$: "structured";
    _id: string;
    _autoValue: SerializedDescriptor;
  }>;
  set: Readonly<{
    $$: "set";
    _id: string;
    _value: readonly (Serialized | unknown)[];
  }>;
};

export type Serialized = NSerialized[keyof NSerialized];

export type S = {
  string: SerializedTypePrimitive<string>;
  number: SerializedTypePrimitive<number>;
  boolean: SerializedTypePrimitive<boolean>;
  null: SerializedTypePrimitive<null>;
  primitive: NSerialized["prim"];
  arrSchema: NSerialized["arr-schema"];
  arr: NSerialized["arr-simple"];
  struct: NSerialized["struct"];
  struct2: NSerialized["struct2"];
  structured: NSerialized["structured"];
  set: NSerialized["set"];
};

export type ApplySerialization<T extends StructuredKind> =
  T extends LinkedPrimitive<infer U>
    ? SerializedTypePrimitive<U>
    : T extends Struct<any>
    ? NSerialized["struct"]
    : T extends Struct2<any>
    ? NSerialized["struct2"]
    : T extends Structured<any, any>
    ? NSerialized["structured"]
    : T extends SSchemaArray<any>
    ? NSerialized["arr-schema"]
    : T extends SArray<any>
    ? NSerialized["arr-simple"]
    : T extends SSet<any>
    ? NSerialized["set"]
    : never;

export type ApplyDeserialization<
  S extends Serialized,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends NSerialized["prim"]
  ? LinkedPrimitive<any>
  : S extends NSerialized["struct"]
  ? Struct<any>
  : S extends NSerialized["struct2"]
  ? Struct2<any>
  : S extends NSerialized["structured"]
  ? Structured<any, any>
  : S extends NSerialized["arr-simple"]
  ? SArray<any>
  : S extends NSerialized["arr-schema"]
  ? SSchemaArray<T>
  : S extends NSerialized["set"]
  ? SSet<T>
  : never;

export type ObjectDeserialization<
  S extends Serialized,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends NSerialized["prim"]
  ? LinkedPrimitive<any>
  : S extends NSerialized["struct"]
  ? Struct<any>
  : S extends NSerialized["struct2"]
  ? Struct2<any>
  : S extends NSerialized["structured"]
  ? Structured<any, any>
  : S extends NSerialized["arr-simple"]
  ? T[]
  : S extends NSerialized["arr-schema"]
  ? T[]
  : S extends NSerialized["set"]
  ? Set<T>
  : never;

///////////////////////////////

export function serialize(state: StructuredKind) {
  return JSON.stringify(simplify(state));
}

///////////////////////////////

/** some initializations require a Schema */
export type Schema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | typeof Structured // Struct
  | (typeof Struct | typeof Struct2 | typeof Structured<any, any>)[]; // SSchemaArray

export type StructSchema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | typeof Structured; // Struct

export type NeedsSchema =
  | Extract<Serialized, { $$: "struct" }>
  | Extract<Serialized, { $$: "struct2" }>
  | Extract<Serialized, { $$: "structured" }>
  | Extract<Serialized, { $$: "arr-schema" }>;

export type NeedsSchemaStruct =
  | Extract<Serialized, { $$: "struct" }>
  | Extract<Serialized, { $$: "struct2" }>
  | Extract<Serialized, { $$: "structured" }>;

export function construct(
  str: string,
  spec:
    | SState<unknown>
    | typeof Struct // Struct
    | (typeof Struct)[] // SArray
) {
  try {
    const json = JSON.parse(str);
    return initialize(json, spec as any);
  } catch (e) {
    console.log("issue with", JSON.parse(str));
    throw e;
  }
}

export function isSeralized(json: unknown): json is Serialized {
  // TODO: more validation?
  return (
    typeof json === "object" &&
    json != null &&
    !Array.isArray(json) &&
    "$$" in json
  );
}

export function isSeralizedStructured(
  json: unknown
): json is NSerialized["structured"] {
  return isSeralized(json) && json.$$ === "structured";
}
