import { SBoolean, SNil, SNumber, SPrimitive, SString } from "..";
import { SArray, SSchemaArray } from "../SArray";
import { Struct } from "../Struct";
import { Struct2 } from "../Struct2";
import { ConstructableStructure, initStructured } from "../Structured";
import { StructSchema, StructuredKind } from "../StructuredKinds";
import {
  assertArray,
  assertConstructableStruct,
  assertConstructableStruct2,
  assertConstructableStructured,
  assertNotArray,
  exhaustive,
} from "../assertions";
import { OrderedMap } from "../lib/OrderedMap";
import { assertNotNull, nullthrows } from "../lib/nullthrows";
import { LinkedPrimitive } from "../state/LinkedPrimitive";
import { SSet } from "../state/LinkedSet";
import { SUnion } from "../sunion";
import {
  NSimplified,
  Simplified,
  SimplifiedRefOf,
  SimplifiedSet,
  SimplifiedSimpleArray,
  SimplifiedTypePrimitive,
  isSimplified,
} from "./serialization";
import { SimplePackage } from "./simplify";

function find<T extends Simplified>(
  json: T,
  metadata: InitializationMetadata
): StructuredKind | null {
  // console.log("looking for", json._id, json.$$);
  const found = metadata.initializedNodes.get(json._id);
  if (found == null) {
    return null;
  }

  // todo: verify json kind matches returned value, or ask for an expected kind class here?
  return found;
}

function refKind<T extends keyof NSimplified>(
  simple: Simplified,
  kind: T
): asserts simple is NSimplified[T] {
  if (simple.$$ !== kind) {
    throw new Error(
      `expected a reference to a ${kind}, found one to a ${simple.$$}`
    );
  }
}

export function initializePrimitive<T>(
  json: SimplifiedTypePrimitive<T> | SimplifiedRefOf<"prim">,
  metadata: InitializationMetadata
): SPrimitive<T> {
  // TODO: optimize sieralized array with "references"?
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  switch (json.$$) {
    case "prim": {
      const result = new LinkedPrimitive(json._value, json._id);
      metadata.initializedNodes.set(result._id, result);
      return result;
    }
    case "ref": {
      const simple = nullthrows(
        metadata?.knownSimples.get(json._id),
        `ref:${json._id}:${json.kind}: didn't find it pre-initialized nor in simples`
      );

      refKind(simple, json.kind);
      const result = new LinkedPrimitive(simple._value, json._id);
      metadata.initializedNodes.set(result._id, result);
      return result as any; // todo: primitive of kind
    }

    default:
      exhaustive(json);
  }
}

function initializeSchemaArray(
  json: NSimplified["arr-schema"],
  spec: StructSchema[],
  metadata: InitializationMetadata
): SSchemaArray<any> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const initialized = json._value.map((x) => {
    // TODO: find right spec
    return initialize(x, spec[0], metadata);
  });

  // todo: cansimplifyStructuredKind only have schema arrays of structured objects rn apparently
  const result = new SSchemaArray(initialized as any, json._id, spec);
  metadata.initializedNodes.set(result._id, result);
  return result;
}

function initializeSimpleArray<T>(
  json: SimplifiedSimpleArray<T>,
  metadata: InitializationMetadata
): SArray<T> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const result = new SArray<T>(json._value as any, json._id);
  metadata.initializedNodes.set(result._id, result);
  return result;
}

function initializeSet<T>(
  json: SimplifiedSet<T>,
  spec: StructSchema | null,
  metadata: InitializationMetadata
): SSet<T> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  let result;
  if (json._schema) {
    const initialized = json._value.map((x: any) => {
      // TODO: find right spec
      return initialize(x, spec, metadata);
    });

    result = SSet._create<T>(initialized as any, json._id);
  } else {
    result = SSet._create<T>(json._value, json._id, null);
  }

  metadata.initializedNodes.set(result._id, result);
  return result;
}

// helpers for structured

// export function deserializeWithSchema<S extends NeedsSchema>(
//   json: NeedsSchema,
//   spec: StructSchema,
//   metadata: InitializationMetadata
// ): ObjectDeserialization<S> | ObjectDeserialization<S>[] {
//   switch (json.$$) {
//     case "struct": {
//       assertNotArray(spec);
//       assertConstructableStruct(spec);
//       return initializeStruct(json, spec, metadata);
//     }
//     case "struct2": {
//       assertNotArray(spec);
//       assertConstructableStruct2(spec);
//       return initializeStruct2(json, spec, metadata);
//     }
//     case "structured": {
//       assertNotArray(spec);
//       assertConstructableStructured(spec);
//       return initializeStructured(
//         json,
//         spec as any,
//         metadata
//       ) as ObjectDeserialization<S>; // todo
//     }
//     case "arr-schema": {
//       assertConstructableObj(spec);
//       const initialized = json._value.map((x: any) => {
//         return initialize(x, spec, metadata);
//       });

//       return initialized as ObjectDeserialization<S>[]; // todo
//     }

//     default:
//       exhaustive(json);
//   }
// }

function initializeStruct(
  json: NSimplified["struct"],
  spec: typeof Struct,
  metadata: InitializationMetadata
) {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  // offer a way to override initialization
  if ("_construct" in spec && typeof spec._construct === "function") {
    const instance = spec._construct(json._value);
    instance._id = json._id;
    // console.log("_constructed", instance, "from", json._value);
    instance._initConstructed(Object.keys(json._value));
    return instance;
  }

  const initialized: Record<any, any> = {};
  for (const key of Object.keys(json._value)) {
    const value = json._value[key];
    if (isSimplified(value)) {
      initialized[key] = initialize(
        json._value[key],
        [initialized[key]?.schema],
        metadata
      );
    } else {
      initialized[key] = value;
    }
  }

  const instance = new (spec as any)(json._value) as any;
  instance._id = json._id;

  for (const key of Object.keys(json._value)) {
    const value = json._value[key];
    if (isSimplified(value)) {
      instance[key] = initialize(
        json._value[key],
        [instance[key]?.schema],
        metadata
      );
    } else {
      instance[key] = value;
    }
  }

  instance._initConstructed(Object.keys(json._value));
  metadata.initializedNodes.set(instance._id, instance);
  return instance;
}

function initializeStruct2(
  json: NSimplified["struct2"],
  spec: typeof Struct2,
  metadata: InitializationMetadata
) {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const { _id, _value } = json;
  const instance = new (spec as any)(..._value);
  instance._id = _id;
  instance._initConstructed(Object.keys(_value));
  metadata.initializedNodes.set(instance._id, instance);
  return instance;
}

export function initializeStructured<Spec extends ConstructableStructure<any>>(
  json: NSimplified["structured"],
  spec: Spec,
  metadata: InitializationMetadata
): InstanceType<Spec> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const instance = spec.construct(json._value, initOfPkg(metadata));
  // note: we override id before calling initStructured. Important! So correct id gets registered
  overrideId(instance, json._id);
  initStructured(instance);
  metadata.initializedNodes.set(instance._id, instance);
  return instance as any; // todo
}

function initializeSUnion(
  json: NSimplified["union"],
  spec: StructSchema,
  metadata: InitializationMetadata
): SUnion<StructuredKind> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const initialized = initialize(json._value, spec, metadata);
  const result = new SUnion(initialized, json._id);
  metadata.initializedNodes.set(result._id, result);
  return result;
}

// function initializeReference(
//   json: NSimplified["reference"],
//   spec: StructSchema,
//   metadata: InitializationMetadata
// ) {
//   const found = find(json, metadata);
//   if (found != null) {
//     return found as any;
//   }

//   return found;
// }

export function initialize(
  json: unknown,
  // A union of of the specs this json could follow
  spec: StructSchema | StructSchema[] | null,
  metadata: InitializationMetadata
): StructuredKind {
  if (!isSimplified(json)) {
    console.log("not serialized", json);
    throw new Error("invalid serialization is not a non-null object");
  }

  switch (json.$$) {
    case "prim": {
      return initializePrimitive(json, metadata);
    }
    case "arr-schema": {
      assertArray(spec);
      return initializeSchemaArray(json, spec, metadata);
    }
    case "arr-simple": {
      return initializeSimpleArray(json, metadata);
    }
    case "struct": {
      assertNotArray(spec);
      assertNotNull(spec);
      assertConstructableStruct(spec);
      return initializeStruct(json, spec, metadata);
    }
    case "struct2": {
      assertNotArray(spec);
      assertNotNull(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec, metadata);
    }
    case "structured": {
      assertNotArray(spec);
      assertNotNull(spec, `Need constructor to initialize a Structured object`);
      assertConstructableStructured(spec);
      return initializeStructured(json, spec as any, metadata);
    }
    case "set": {
      assertNotArray(spec);
      return initializeSet(json, spec, metadata);
    }
    case "union": {
      assertNotArray(spec);
      assertNotNull(spec);
      return initializeSUnion(json, spec, metadata);
    }
    case "ref": {
      // fetch acutal node
      const simple = nullthrows(
        metadata.knownSimples.get(json._id),
        `ref:${json._id}:${json.kind}: didn't find it pre-initialized nor in simples`
      );
      refKind(simple, json.kind);
      // initialize it
      return initialize(simple, spec, metadata);
    }
    default:
      exhaustive(json, "invalid $$ type");
  }
}

// export function initializeRef(
//   json: NSimplified["ref"],
//   spec: StructSchema | StructSchema[] | null,
//   metadata: InitializationMetadata
// ): StructuredKind {
//   // fetch acutal node
//   const simple = nullthrows(
//     metadata.knownSimples.get(json._id),
//     `ref:${json._id}:${json.kind}: didn't find it pre-initialized nor in simples`
//   );
//   refKind(simple, json.kind);
//   // initialize it
//   return initialize(simple, spec, metadata);
// }

export type InitFunctions = Readonly<{
  string: (json: SimplifiedTypePrimitive<string>) => SString;
  number: (json: SimplifiedTypePrimitive<number>) => SNumber;
  boolean: (json: SimplifiedTypePrimitive<boolean>) => SBoolean;
  null: (json: SimplifiedTypePrimitive<null>) => SNil;
  primitive: <T>(json: SimplifiedTypePrimitive<T>) => SPrimitive<T>;
  schemaArray: (
    json: NSimplified["arr-schema"],
    spec: StructSchema[]
  ) => SSchemaArray<any>;
  array: <T>(json: SimplifiedSimpleArray<T>) => SArray<T>;
  struct: (json: NSimplified["struct"], spec: typeof Struct) => any; // todo
  struct2: (json: NSimplified["struct2"], spec: typeof Struct2) => any; // todo
  structured: <Spec extends ConstructableStructure<any>>(
    json: NSimplified["structured"],
    spec: Spec
  ) => InstanceType<Spec>;
  set: <T>(json: SimplifiedSet<T>, spec: StructSchema) => SSet<T>;
}>;

export class InitializationMetadata {
  readonly knownSimples: OrderedMap<string, Simplified>;
  readonly initializedNodes: Map<string, StructuredKind>;
  constructor(pkg: SimplePackage) {
    this.knownSimples = OrderedMap.fromEntries(pkg.nodes);
    this.initializedNodes = new Map();
  }
}

/** `this` on second argument to avoid double-initializing the same elements */
function initOfPkg(metadata: InitializationMetadata): InitFunctions {
  return {
    string: (json: SimplifiedTypePrimitive<string>) =>
      initializePrimitive<string>(json, metadata),
    number: (json: SimplifiedTypePrimitive<number>) =>
      initializePrimitive<number>(json, metadata),
    boolean: (json: SimplifiedTypePrimitive<boolean>) =>
      initializePrimitive<boolean>(json, metadata),
    null: (json: SimplifiedTypePrimitive<null>) =>
      initializePrimitive<null>(json, metadata),
    primitive: <T>(json: SimplifiedTypePrimitive<T>) =>
      initializePrimitive(json, metadata),
    schemaArray: (json: NSimplified["arr-schema"], spec: StructSchema[]) =>
      initializeSchemaArray(json, spec, metadata),
    array: <T>(json: SimplifiedSimpleArray<T>) =>
      initializeSimpleArray(json, metadata),
    struct: (json: NSimplified["struct"], spec: typeof Struct) =>
      initializeStruct(json, spec, metadata),
    struct2: (json: NSimplified["struct2"], spec: typeof Struct2) =>
      initializeStruct2(json, spec, metadata),
    structured: <Spec extends ConstructableStructure<any>>(
      json: NSimplified["structured"],
      spec: Spec
    ) => initializeStructured(json, spec, metadata),
    set: <T>(json: SimplifiedSet<T>, spec: StructSchema) =>
      initializeSet(json, spec, metadata),
  } as const;
}

/** gets over readonly id */
function overrideId(obj: StructuredKind, id: string) {
  (obj as any)._id = id;
}
