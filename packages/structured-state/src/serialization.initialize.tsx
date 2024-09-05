import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured, initStructured } from "./Structured";
import {
  assertArray,
  assertConstructableObj,
  assertConstructableStruct,
  assertConstructableStruct2,
  assertConstructableStructured,
  assertNotArray,
  exhaustive,
} from "./assertions";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import * as s from "./sstate";
import { SArray, SSchemaArray } from "./sstate";
import {
  Serialized,
  StructSchema,
  NeedsSchema,
  ObjectDeserialization,
  isSeralized,
  Schema,
} from "./serialization";
import { SSet } from ".";

function initializePrimitive(json: Extract<Serialized, { $$: "prim" }>) {
  return new LinkedPrimitive(json._value, json._id);
}

function initializeSchemaArray(
  json: Extract<Serialized, { $$: "arr-schema" }>,
  spec: StructSchema[]
) {
  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec);
  });

  return new s.SSchemaArray(initialized as any, json._id, spec);
}

function initializeSimpleArray(
  json: Extract<Serialized, { $$: "arr-simple" }>
) {
  return new SArray(json._value as any, json._id);
}
// helpers for structured

export function deserializeWithSchema<S extends NeedsSchema>(
  json: NeedsSchema,
  spec: StructSchema
): ObjectDeserialization<S> | ObjectDeserialization<S>[] {
  switch (json.$$) {
    case "struct": {
      assertNotArray(spec);
      assertConstructableStruct(spec);
      return initializeStruct(json, spec);
    }
    case "struct2": {
      assertNotArray(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec);
    }
    case "structured": {
      assertNotArray(spec);
      assertConstructableStructured(spec);
      return initializeStructured(json, spec) as any;
    }
    case "arr-schema": {
      assertConstructableObj(spec);
      const initialized = json._value.map((x: any) => {
        return initialize(x, spec);
      });

      return initialized as ObjectDeserialization<S>[]; // todo
    }

    default:
      exhaustive(json);
  }
}

export function serializeWithSchema(spec: StructSchema) {}
function initializeStruct(
  json: Extract<Serialized, { $$: "struct" }>,
  spec: typeof Struct
) {
  const { _id, _value } = json;

  // offer a way to override initialization
  if ("_construct" in spec && typeof spec._construct === "function") {
    const instance = spec._construct(_value, deserializeWithSchema);
    instance._id = _id;
    // console.log("_constructed", instance, "from", _value);
    instance._initConstructed(Object.keys(_value));
    return instance;
  }

  const initialized: Record<any, any> = {};
  for (const key of Object.keys(_value)) {
    const value = _value[key];
    if (isSeralized(value)) {
      initialized[key] = initialize(_value[key], [initialized[key]?.schema]);
    } else {
      initialized[key] = value;
    }
  }

  const instance = new (spec as any)(_value) as any;
  instance._id = _id;

  for (const key of Object.keys(_value)) {
    const value = _value[key];
    if (isSeralized(value)) {
      instance[key] = initialize(_value[key], [instance[key]?.schema]);
    } else {
      instance[key] = value;
    }
  }

  instance._initConstructed(Object.keys(_value));

  return instance;
}

function initializeStruct2(
  json: Extract<Serialized, { $$: "struct2" }>,
  spec: typeof Struct2
) {
  const { _id, _value } = json;
  const instance = new (spec as any)(..._value);
  instance._id = _id;
  instance._initConstructed(Object.keys(_value));
  return instance;
}

function initializeStructured(
  json: Extract<Serialized, { $$: "structured" }>,
  spec: typeof Structured
) {
  const { _id, _value } = json;
  const instance = (spec as any).construct(
    _value,
    deserializeWithSchema
  ) as Structured<any, any>;
  (instance as any)._id = _id;
  initStructured(instance);
  return instance;
}

function initializeSet(
  json: Extract<Serialized, { $$: "set" }>,
  spec: StructSchema
) {
  const initialized = json._value.map((x: any) => {
    // TODO: find right spec
    return initialize(x, spec);
  });

  return SSet.create(initialized as any, json._id);
}

export function initialize(
  json: unknown,
  // A union of of the specs this json could follow
  spec: Schema
): LinkedPrimitive<any> | SArray<any> | SSchemaArray<any> | Struct<any> {
  if (!isSeralized(json)) {
    console.log("not serialized", json);
    throw new Error("invalid serialization is not a non-null object");
  }

  switch (json.$$) {
    case "prim": {
      return initializePrimitive(json);
    }
    case "arr-schema": {
      assertArray(spec);
      return initializeSchemaArray(json, spec);
    }
    case "arr-simple": {
      return initializeSimpleArray(json);
    }
    case "struct": {
      assertNotArray(spec);
      assertConstructableStruct(spec);
      return initializeStruct(json, spec);
    }
    case "struct2": {
      assertNotArray(spec);
      assertConstructableStruct2(spec);
      return initializeStruct2(json, spec);
    }
    case "structured": {
      assertNotArray(spec);
      assertConstructableStructured(spec);
      return initializeStructured(json, spec) as any;
    }
    case "set": {
      assertNotArray(spec);
      assertConstructableStructured(spec);
      return initializeSet(json, spec) as any;
    }
    default:
      exhaustive(json, "invalid $$ type");
  }
}
