//////// Schema ////////

import { nanoid } from "nanoid";
import { Structured } from ".";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { getGlobalState } from "./sstate.history";
import { LinkedArray } from "./state/LinkedArray";
import { LinkedMap } from "./state/LinkedMap";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { SSet } from "./state/LinkedSet";
import { SubbableContainer } from "./state/SubbableContainer";
import { JSONValue } from "./types";
import { StructSchema } from "./StructuredKinds";

// todo? create -> of
export class SString extends LinkedPrimitive<string> {
  static create(val: string) {
    return LinkedPrimitive.of(val);
  }
}
export class SNumber extends LinkedPrimitive<number> {
  static create(val: number) {
    return LinkedPrimitive.of(val);
  }
}
export class SBoolean extends LinkedPrimitive<boolean> {
  static create(val: boolean) {
    return LinkedPrimitive.of(val);
  }
}
export class SNil extends LinkedPrimitive<null> {
  static create(val: null) {
    return LinkedPrimitive.of(val);
  }
}

export class UNINITIALIZED_PRIMITIVE {}
export class UNINITIALIZED_ARRAY {}
export class UNINITIALIZED_TYPED_ARRAY<
  S extends (SState<unknown> | typeof Struct)[]
> {
  schema: S;
  constructor(schema: S) {
    this.schema = schema;
  }
}

export type SOut<T> = T extends SNumber
  ? number
  : T extends SString
  ? string
  : T extends SBoolean
  ? boolean
  : T extends SNil
  ? null
  : T extends SArray<infer O>
  ? O[]
  : // ? {
    //     [Key in keyof O]: NWOut<O[Key]>;
    //   }
    never;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SState<T> {}

/** Describes an array */
export class SArray<T> extends LinkedArray<T> {
  // readonly _differentiator = "sarray";
  constructor(val: T[], id: string) {
    super(val, id);
    getGlobalState().knownObjects.set(this._id, this);
  }
}

/** Describes an array of subbable objects */
export class SSchemaArray<
  T extends Struct<any> | Struct2<any> | Structured<any, any>
> extends LinkedArray<T> {
  _schema: StructSchema[];

  // // TODO: do I need this? I think I was planning on using this in history, but since
  // // we just recreate the whole thing instead we don't need it anymore.
  // protected override _containedIds: WeakRefMap<T>;

  // protected override _contain(items: Array<T>) {
  //   for (const elem of items) {
  //     elem._container = this;
  //     // When initializng, we contain all values passed to super(), before we create this._containedIds, so it will be null
  //     // TODO, we can remove this by removing the initail contain out to SSchemaArray and SArray. We stop containing twice on init too.
  //     this._containedIds?.set(elem._id, elem);
  //   }
  // }

  // protected override _uncontain(item: T) {
  //   if (isContainable(item)) {
  //     item._container = null;
  //     this._containedIds.delete(item._id);

  //     // TODO: safety
  //     if ("_destroy" in item) {
  //       item._destroy();
  //     }
  //   }
  // }

  constructor(val: T[], id: string, schema: StructSchema[]) {
    super(val, id);
    getGlobalState().knownObjects.set(this._id, this);
    this._schema = schema;
    /**
     * We want to store the ids we contain to replace on history. When we want to
     * to replace with a serialized array:
     * - If we still contain that containable, we just replace it
     * - If we don't contain that containable, we add it
     * - TODO: figure out what to do if elemnet is not containable. Or split definition here,
     *   between arrays of containables and arrays of non-containables, and just always override
     *   the underlying array when we're dealing with an array of non-containables
     *
     * TODO: we acutally never use this, so commenting it out for now
     */
    // this._containedIds = new WeakRefMap<T>(10_000, "SSchemaArray");
    SubbableContainer._containAll(this, this._array);
  }
}

export function string(value?: string): SString {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SString.of(value);
}

export function number(value?: number): SNumber {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SNumber.of(value);
}

export function boolean(value?: boolean): SBoolean {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SBoolean.of(value);
}

export function nil(): SNil {
  return SNil.of(null);
}

export function arrayOf<T extends StructSchema>(
  schema: T[],
  val?: InstanceType<T>[]
  // schema: NWArray<NWInLax<SubOutLax<T>>>
): SSchemaArray<InstanceType<T>> {
  return val == null
    ? (new UNINITIALIZED_TYPED_ARRAY(schema) as any)
    : new SSchemaArray(val, nanoid(5), schema);
}

export function array<T extends JSONValue>(val?: T[]): SArray<T> {
  return val == null
    ? (new UNINITIALIZED_ARRAY() as any)
    : new SArray(val, nanoid(5));
}

export function map<K, V>(initialValue?: Map<K, V>) {
  return LinkedMap.create(initialValue);
}

export function set<T>(initialValue?: Iterable<T>) {
  return SSet._create(initialValue);
}

export function setOf<T extends StructSchema>(
  schema: T,
  initialValue?: Iterable<InstanceType<T>>
) {
  return SSet._create(initialValue, undefined, schema);
}
