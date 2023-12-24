//////// Schema ////////

import { nanoid } from "nanoid";
import { Struct2 } from "./Struct2";
import { isContainable } from "./assertions";
import { LinkedArray } from "./lib/state/LinkedArray";
import type {
  Contained,
  StateChangeHandler,
} from "./lib/state/LinkedPrimitive";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import {
  MutationHashable,
  SubbableContainer,
} from "./lib/state/MutationHashable";
import { Subbable, notify } from "./lib/state/Subbable";
import { getGlobalState, saveForHistory } from "./sstate.history";
import { JSONValue } from "./types";

// todo? create -> of
class SString extends LinkedPrimitive<string> {
  static create(val: string) {
    return LinkedPrimitive.of(val);
  }
}
class SNumber extends LinkedPrimitive<number> {
  static create(val: number) {
    return LinkedPrimitive.of(val);
  }
}
class SBoolean extends LinkedPrimitive<boolean> {
  static create(val: boolean) {
    return LinkedPrimitive.of(val);
  }
}
class SNil extends LinkedPrimitive<null> {
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

type IsEmptyObjType<T extends Record<PropertyKey, any>> = keyof T extends never
  ? true
  : false;

type SPrimitiveFieldsToSOut<T extends Record<string, any>> = {
  [key in keyof T as T[key] extends LinkedPrimitive<any> | SArray<any>
    ? key
    : never]: SOut<T[key]>;
};

type IntrinsicFields<T extends Record<string, any>> = Omit<
  {
    [key in keyof T as T[key] extends LinkedPrimitive<any> | SArray<any>
      ? never
      : key]: T[key];
  },
  keyof Struct<any>
>;

type NeverIfEmpty<T> = {} extends T ? never : T;

type StateProps<T extends Record<string, any>> = SPrimitiveFieldsToSOut<T>;

type PropsForStruct<Child extends Struct<any>> = IsEmptyObjType<
  SPrimitiveFieldsToSOut<Child>
> extends true
  ? null
  : SPrimitiveFieldsToSOut<Child>;

export abstract class Struct<Child extends Struct<any>>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  _hash: number = 0;
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _container: SubbableContainer | null = null;

  static readonly IGNORE_KEYS = new Set<string>([
    "_hash",
    "_subscriptors",
    "_container",
    "_stateKeys",
    "_unsub",
    "_id",
  ]);

  get _kind() {
    return this.constructor.name;
  }

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  constructor(_props: StructProps<Child, any>) {
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  _initConstructed(props: string[]) {
    const self = this as any;

    for (const key of props) {
      const child = self[key];
      if (isContainable(child)) {
        child._container = this;
      }
    }
    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  // TODO: checked at the create(...) function level
  _init(args: Record<string, any> | null) {
    // TODO, we subscribe to children. If my child subscribes to me instead, they can keep the destroy function.
    // If not, I keep the destroy function and can use it when I remove a child

    if (args == null) {
      return;
    }

    const self = this as any;

    // todo, make htis more efficient than iterating throuhg all my props?
    // maybe with a close trick to see what gets initializded between Struct.super() and _init?
    // or something along those lines?
    for (const key in this) {
      let child = self[key];
      if (child instanceof UNINITIALIZED_PRIMITIVE) {
        self[key] = LinkedPrimitive.of(args[key]);
      }

      if (child instanceof UNINITIALIZED_ARRAY) {
        self[key] = new SArray(args[key], nanoid(5));
      }

      if (child instanceof UNINITIALIZED_TYPED_ARRAY) {
        self[key] = new SSchemaArray(args[key], nanoid(5), child.schema);
      }

      // Act on initialized keys
      child = self[key];

      if (isContainable(child)) {
        child._container = this;
      }
    }
    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  _childChanged(child: Subbable) {
    MutationHashable.mutated(this, child);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  // unnecesary?
  _destroy() {
    this._container = null;
    // console.log("DESTROY", this);
  }

  featuredMutation(action: () => void) {
    saveForHistory(this);
    action();
    this._notifyChange();
  }

  _notifyChange() {
    MutationHashable.mutated(this, this);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }
}

export type AnyClass = {
  new (...args: any[]): Struct<any>;
};

type OneArgClass = {
  new (arg1: any): Struct<any>;
};

export type StructProps<
  T extends Struct<any>,
  U extends Record<string, any>
> = SPrimitiveFieldsToSOut<T> & U;

export type ConstructorArguments<T extends AnyClass> = T extends OneArgClass
  ? ConstructorParameters<T>
  : [PropsForStruct<InstanceType<T>>];

export function create<S extends AnyClass>(
  klass: S,
  ...args: ConstructorArguments<S>
): InstanceType<S> {
  const res = new klass(...args) as any;
  res._init(...args);
  return res;
}

export interface SState<T> {}

/** Describes an array of subbable objects */
export class SSchemaArray<T extends Struct<any>> extends LinkedArray<T> {
  _schema: (typeof Struct | typeof Struct2)[];

  constructor(
    val: T[],
    id: string,
    schema: (typeof Struct | typeof Struct2)[]
  ) {
    super(val, id);
    getGlobalState().knownObjects.set(this._id, this);
    this._schema = schema;
  }
}

/** Describes an array */
export class SArray<T> extends LinkedArray<T> {
  constructor(val: T[], id: string) {
    super(val, id);
    getGlobalState().knownObjects.set(this._id, this);
  }
}

export function string(value?: string): SString {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SString.of(value);
}

export function number(value?: number): LinkedPrimitive<number> {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SNumber.of(value);
}

export function boolean(value?: boolean) {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SBoolean.of(value);
}

export function nil() {
  return SNil.of(null);
}

export function arrayOf<T extends typeof Struct>(
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

export { SBoolean, SNil, SNumber, SString };
