import { simplifyAndPackage } from "./serialization.simplify";
import { SArray, SSchemaArray } from "./sstate";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { PrimitiveKind, StructuredKind } from "./StructuredKinds";

export type Simplified = NSimplified[keyof NSimplified];

export type SimplifiedDescriptor = Record<string, Simplified | PrimitiveKind>;

export type SimplifiedTypePrimitive<T> = Readonly<{
  $$: "prim";
  _id: string;
  _value: T;
}>;

export type SimplifiedSimpleArray<T> = Readonly<{
  $$: "arr-simple";
  _id: string;
  _value: readonly T[];
}>;

export type SimplifiedSchemaArray<T extends Simplified> = Readonly<{
  $$: "arr-schema";
  _id: string;
  _value: readonly T[];
}>;

export type SimplifiedSet<T> = Readonly<{
  $$: "set";
  _schema: boolean;
  _id: string;
  _value: readonly T[];
}>;

export type SimplifiedKind = NSimplified[keyof NSimplified]["$$"];

export type NSimplified = {
  prim: SimplifiedTypePrimitive<unknown>;

  set: SimplifiedSet<unknown>;
  "arr-simple": SimplifiedSimpleArray<unknown>;

  "arr-schema": Readonly<{
    $$: "arr-schema";
    _id: string;
    _value: readonly Simplified[];
  }>;

  struct: Readonly<{
    $$: "struct";
    _id: string;
    _value: {
      [key: string]: Simplified | unknown;
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
    _value: SimplifiedDescriptor;
  }>;

  // todo
  union: Readonly<{
    $$: "union";
    _id: string;
    _value: Simplified;
  }>;
  // todo
  reference: Readonly<{ $$: "ref"; _id: string }>;
};

export type S = {
  string: SimplifiedTypePrimitive<string>;
  number: SimplifiedTypePrimitive<number>;
  boolean: SimplifiedTypePrimitive<boolean>;
  null: SimplifiedTypePrimitive<null>;
  primitive: NSimplified["prim"];
  arrSchema: NSimplified["arr-schema"];
  arr: NSimplified["arr-simple"];
  struct: NSimplified["struct"];
  struct2: NSimplified["struct2"];
  structured: NSimplified["structured"];
  set: NSimplified["set"];
};

export type ApplySerialization<T extends StructuredKind> =
  T extends LinkedPrimitive<infer U>
    ? SimplifiedTypePrimitive<U>
    : T extends Struct<any>
    ? NSimplified["struct"]
    : T extends Struct2<any>
    ? NSimplified["struct2"]
    : T extends Structured<any, any>
    ? NSimplified["structured"]
    : T extends SSchemaArray<any>
    ? NSimplified["arr-schema"]
    : T extends SArray<infer U>
    ? SimplifiedSimpleArray<U>
    : T extends SSet<any>
    ? NSimplified["set"]
    : never;

export type ApplyDeserialization<
  S extends Simplified,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends NSimplified["prim"]
  ? LinkedPrimitive<any>
  : S extends NSimplified["struct"]
  ? Struct<any>
  : S extends NSimplified["struct2"]
  ? Struct2<any>
  : S extends NSimplified["structured"]
  ? Structured<any, any>
  : S extends NSimplified["arr-simple"]
  ? SArray<any>
  : S extends NSimplified["arr-schema"]
  ? SSchemaArray<T>
  : S extends NSimplified["set"]
  ? SSet<T>
  : never;

export type ObjectDeserialization<
  S extends Simplified,
  T extends Struct<any> | Struct2<any> | Structured<any, any> = any
> = S extends NSimplified["prim"]
  ? LinkedPrimitive<any>
  : S extends NSimplified["struct"]
  ? Struct<any>
  : S extends NSimplified["struct2"]
  ? Struct2<any>
  : S extends NSimplified["structured"]
  ? Structured<any, any>
  : S extends NSimplified["arr-simple"]
  ? T[]
  : S extends NSimplified["arr-schema"]
  ? T[]
  : S extends NSimplified["set"]
  ? Set<T>
  : never;

///////////////////////////////

export function serialize(state: StructuredKind): string {
  const allIds = new Set<string>();
  const simplified = simplifyAndPackage(state);
  const result = JSON.stringify(simplified);
  // console.log(allIds);
  return result;
}

///////////////////////////////

/** some initializations require a Schema */
export type Schema =
  | typeof Struct // Struct
  | typeof Struct2 // Struct
  | typeof Structured // Struct
  | (typeof Struct | typeof Struct2 | typeof Structured<any, any>)[]; // SSchemaArray

export type NeedsSchema =
  | NSimplified["struct"]
  | NSimplified["struct2"]
  | NSimplified["structured"]
  | NSimplified["arr-schema"];
// | NSimplified["set"];

export type NeedsSchemaStruct =
  | Extract<Simplified, { $$: "struct" }>
  | Extract<Simplified, { $$: "struct2" }>
  | Extract<Simplified, { $$: "structured" }>;

export function isSimplified(json: unknown): json is Simplified {
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
): json is NSimplified["structured"] {
  return isSimplified(json) && json.$$ === "structured";
}
