import { SBoolean, SNil, SNumber, SPrimitive, SString } from ".";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { ConstructableStructure, initStructured } from "./Structured";
import { StructuredKind } from "./StructuredKinds";
import {
  assertArray,
  assertConstructableObj,
  assertConstructableStruct,
  assertConstructableStruct2,
  assertConstructableStructured,
  assertNotArray,
  exhaustive,
} from "./assertions";
import {
  NSimplified,
  NeedsSchema,
  ObjectDeserialization,
  Serialized,
  SimplifiedSimpleArray,
  SimplifiedSimpleSet,
  SimplifiedTypePrimitive,
  StructSchema,
  isSeralized,
} from "./serialization";
import { SArray, SSchemaArray } from "./sstate";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { SUnion } from "./sunion";

function find(
  json: Serialized,
  metadata: InitializationMetadata | null
): StructuredKind | null {
  const found = metadata?.initializedObjects.get(json._id);
  if (found == null) {
    return null;
  }

  // todo: verify json kind matches returned value, or ask for an expected kind class here?
  return found;
}

function initializePrimitive<T>(
  json: SimplifiedTypePrimitive<T>,
  metadata: InitializationMetadata | null
): SPrimitive<T> {
  // TODO: optimize sieralized array with "references"?
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const result = new LinkedPrimitive(json._value, json._id);
  metadata?.initializedObjects.set(result._id, result);
  return result;
}

function initializeSchemaArray(
  json: NSimplified["arr-schema"],
  spec: StructSchema[],
  metadata: InitializationMetadata | null
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
  metadata?.initializedObjects.set(result._id, result);
  return result;
}

function initializeSimpleArray<T>(
  json: SimplifiedSimpleArray<T>,
  metadata: InitializationMetadata | null
): SArray<T> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const result = new SArray<T>(json._value as any, json._id);
  metadata?.initializedObjects.set(result._id, result);
  return result;
}
// helpers for structured

export function deserializeWithSchema<S extends NeedsSchema>(
  json: NeedsSchema,
  spec: StructSchema,
  metadata: InitializationMetadata | null
): ObjectDeserialization<S> | ObjectDeserialization<S>[] {
  switch (json.$$) {
    case "struct": {
      assertNotArray(spec);
      assertConstructableStruct(spec);
      return initializeStruct(json, spec, metadata);
    }
    case "struct2": {
      assertNotArray(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec, metadata);
    }
    case "structured": {
      assertNotArray(spec);
      assertConstructableStructured(spec);
      return initializeStructured(
        json,
        spec as any,
        metadata
      ) as ObjectDeserialization<S>; // todo
    }
    case "arr-schema": {
      assertConstructableObj(spec);
      const initialized = json._value.map((x: any) => {
        return initialize(x, spec, metadata);
      });

      return initialized as ObjectDeserialization<S>[]; // todo
    }

    default:
      exhaustive(json);
  }
}

function initializeStruct(
  json: NSimplified["struct"],
  spec: typeof Struct,
  metadata: InitializationMetadata | null
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
    if (isSeralized(value)) {
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
    if (isSeralized(value)) {
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
  metadata?.initializedObjects.set(instance._id, instance);
  return instance;
}

function initializeStruct2(
  json: NSimplified["struct2"],
  spec: typeof Struct2,
  metadata: InitializationMetadata | null
) {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const { _id, _value } = json;
  const instance = new (spec as any)(..._value);
  instance._id = _id;
  instance._initConstructed(Object.keys(_value));
  metadata?.initializedObjects.set(instance._id, instance);
  return instance;
}

function initializeStructured<Spec extends ConstructableStructure<any>>(
  json: NSimplified["structured"],
  spec: Spec,
  metadata: InitializationMetadata | null
): InstanceType<Spec> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const instance = spec.construct(
    json._autoValue,
    metadata ? metadata.init : InitializationMetadata.plainInit
  );
  // note: we override id before calling initStructured. Important! So correct id gets registered
  overrideId(instance, json._id);
  initStructured(instance);
  metadata?.initializedObjects.set(instance._id, instance);
  return instance as any; // todo
}

function initializeSet<T>(
  json: SimplifiedSimpleSet<T>,
  spec: StructSchema,
  metadata: InitializationMetadata | null
): SSet<T> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec, metadata);
  });

  const result = SSet.create<T>(initialized as any, json._id);
  metadata?.initializedObjects.set(result._id, result);
  return result;
}

function initializeSUnion(
  json: NSimplified["union"],
  spec: StructSchema,
  metadata: InitializationMetadata | null
): SUnion<StructuredKind> {
  const found = find(json, metadata);
  if (found != null) {
    return found as any;
  }

  const initialized = initialize(json._value, spec, metadata);
  const result = new SUnion(initialized, json._id);
  metadata?.initializedObjects.set(result._id, result);
  return result;
}

export function initialize(
  json: unknown,
  // A union of of the specs this json could follow
  spec: StructSchema | StructSchema[],
  metadata: InitializationMetadata | null
): StructuredKind {
  if (!isSeralized(json)) {
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
      assertConstructableStruct(spec);
      return initializeStruct(json, spec, metadata);
    }
    case "struct2": {
      assertNotArray(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec, metadata);
    }
    case "structured": {
      assertNotArray(spec);
      assertConstructableStructured(spec);
      return initializeStructured(json, spec as any, metadata);
    }
    case "set": {
      assertNotArray(spec);
      return initializeSet(json, spec, metadata) as any;
    }
    case "union": {
      assertNotArray(spec);
      return initializeSUnion(json, spec, metadata);
    }
    default:
      exhaustive(json, "invalid $$ type");
  }
}

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
  set: <T>(json: SimplifiedSimpleSet<T>, spec: StructSchema) => SSet<T>;
}>;

export class InitializationMetadata {
  readonly initializedObjects = new Map<string, StructuredKind>();
  readonly init: InitFunctions;
  constructor() {
    this.init = {
      string: (json: SimplifiedTypePrimitive<string>) =>
        initializePrimitive<string>(json, this),
      number: (json: SimplifiedTypePrimitive<number>) =>
        initializePrimitive<number>(json, this),
      boolean: (json: SimplifiedTypePrimitive<boolean>) =>
        initializePrimitive<boolean>(json, this),
      null: (json: SimplifiedTypePrimitive<null>) =>
        initializePrimitive<null>(json, this),
      primitive: <T,>(json: SimplifiedTypePrimitive<T>) =>
        initializePrimitive(json, this),
      schemaArray: (json: NSimplified["arr-schema"], spec: StructSchema[]) =>
        initializeSchemaArray(json, spec, this),
      array: <T,>(json: SimplifiedSimpleArray<T>) =>
        initializeSimpleArray(json, this),
      struct: (json: NSimplified["struct"], spec: typeof Struct) =>
        initializeStruct(json, spec, this),
      struct2: (json: NSimplified["struct2"], spec: typeof Struct2) =>
        initializeStruct2(json, spec, this),
      structured: <Spec extends ConstructableStructure<any>>(
        json: NSimplified["structured"],
        spec: Spec
      ) => initializeStructured(json, spec, this),
      set: <T,>(json: SimplifiedSimpleSet<T>, spec: StructSchema) =>
        initializeSet(json, spec, this),
    } as const;
  }

  /** used for replace */
  static plainInit: InitFunctions = {
    string: (json: SimplifiedTypePrimitive<string>): SString =>
      initializePrimitive<string>(json, null),
    number: (json: SimplifiedTypePrimitive<number>) =>
      initializePrimitive<number>(json, null),
    boolean: (json: SimplifiedTypePrimitive<boolean>) =>
      initializePrimitive<boolean>(json, null),
    null: (json: SimplifiedTypePrimitive<null>) =>
      initializePrimitive<null>(json, null),
    primitive: <T,>(json: SimplifiedTypePrimitive<T>) =>
      initializePrimitive(json, null),
    schemaArray: (json: NSimplified["arr-schema"], spec: StructSchema[]) =>
      initializeSchemaArray(json, spec, null),
    array: <T,>(json: SimplifiedSimpleArray<T>) =>
      initializeSimpleArray(json, null),
    struct: (json: NSimplified["struct"], spec: typeof Struct) =>
      initializeStruct(json, spec, null),
    struct2: (json: NSimplified["struct2"], spec: typeof Struct2) =>
      initializeStruct2(json, spec, null),
    structured: <Spec extends ConstructableStructure<any>>(
      json: NSimplified["structured"],
      spec: Spec
    ) => initializeStructured(json, spec, null),
    set: <T,>(json: SimplifiedSimpleSet<T>, spec: StructSchema) =>
      initializeSet(json, spec, null),
  };
}

/** gets over readonly id */
function overrideId(obj: StructuredKind, id: string) {
  (obj as any)._id = id;
}
