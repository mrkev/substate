//////// Schema ////////

import { nanoid } from "nanoid";
import { globalState } from "./sstate.history";
import { LinkedArray } from "./state/LinkedArray";
import type { Contained, LS, StateChangeHandler } from "./state/LinkedState";
import { SPrimitive } from "./state/LinkedState";
import { MutationHashable, SubbableContainer } from "./state/MutationHashable";
import { Subbable, notify } from "./state/Subbable";

class SString extends SPrimitive<string> {}
class SNumber extends SPrimitive<number> {}
class SBoolean extends SPrimitive<boolean> {}
class SNil extends SPrimitive<null> {}

class UNINITIALIZED_PRIMITIVE {}
class UNINITIALIZED_ARRAY<S extends (SState<unknown> | typeof Struct)[]> {
  schema: S;
  constructor(schema: S) {
    this.schema = schema;
  }
}

export type SOut<T extends LS<unknown>> = T extends SNumber
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

export type SPrimitiveFieldsToSOut<T extends Record<string, any>> = {
  [key in keyof T as T[key] extends SPrimitive<any> | SArray<any>
    ? key
    : never]: SOut<T[key]>;
};

export type PropsForStruct<Child extends Struct<any>> = IsEmptyObjType<
  SPrimitiveFieldsToSOut<Child>
> extends true
  ? null
  : SPrimitiveFieldsToSOut<Child>;

export class Struct<Child extends Struct<any>>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  _hash: number = 0;
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _container: SubbableContainer | null = null;

  private _unsub: (() => void) | null = null;

  get _kind() {
    return this.constructor.name;
  }

  private readonly stateKeys: Map<keyof Child, null> = new Map();

  // TODO: checked at the create(...) function level
  _init(args: Record<string, any> | null) {
    // TODO, we subscribe to children. If my child subscribes to me instead, they can keep the destroy function.
    // If not, I keep the destroy function and can use it when I remove a child

    if (args == null) {
      return;
    }

    const self = this as any;

    for (const key in args) {
      let child = self[key];
      if (child instanceof UNINITIALIZED_PRIMITIVE) {
        self[key] = new SPrimitive(args[key]);
      }

      if (child instanceof UNINITIALIZED_ARRAY) {
        self[key] = new SArray(child.schema, args[key]);
      }

      // Act on initialized keys
      child = self[key];

      if (child instanceof SArray) {
        (this.stateKeys as Map<string, any>).set(key, null);
        child._container = this;
        // const unsub = subscribe(child, this._childChanged.bind(this));
        // console.log("SArray container:", obj, "<-", res);
        // todo ARG FOR ARRAY
      }

      if (child instanceof SPrimitive) {
        (this.stateKeys as Map<string, any>).set(key, null);
        child._container = this;
        // const unsub = subscribe(child, this._childChanged.bind(this));
        // console.log("SPrimitive container:", obj, "<-", res);
      }
    }
  }

  _childChanged(child: Subbable) {
    MutationHashable.mutated(this);
    notify(this, child);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  _destroy() {
    this._container = null;
    this._unsub?.();
    console.log("DESTROY", this);
  }

  constructor(
    _props: IsEmptyObjType<SPrimitiveFieldsToSOut<Child>> extends true
      ? null
      : SPrimitiveFieldsToSOut<Child>
  ) {
    this._id = this._kind + "." + nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  serialize() {
    return JSON.stringify(this, null, 2);
  }

  toJSON() {
    const IGNORE = new Set([
      "_hash",
      "_subscriptors",
      "_container",
      "stateKeys",
      "_unsub",
    ]);
    // const result: Record<any, any> = { _kind: this._kind };
    const result: Record<any, any> = {};

    const keys = Object.keys(this);

    for (const key of keys) {
      if (IGNORE.has(key)) {
        continue;
      }

      const val = (this as any)[key];
      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean" ||
        val == null
      ) {
        result[key] = (this as any)[key];
      } else if (typeof val === "function") {
        continue;
      } else {
        result[key] = (this as any)[key].toJSON();
      }
    }
    return result;
  }
}

export function create2<S extends { new (...args: any[]): Struct<any> }>(
  klass: S,
  arg: PropsForStruct<InstanceType<S>>
): InstanceType<S> {
  const res = new klass(arg) as any;
  console.log("INITIALIZING");
  res._init(arg);
  globalState.knownObjects.set(res._id, res);
  return res;
}

// export function create<S extends { new (...args: any[]): Struct<any> }>(
//   klass: S,
//   arg: ConstructorParameters<S>[0]
// ): InstanceType<S> {
//   const res = new klass(arg) as any;
//   for (const key in arg) {
//     let obj = (res as any)[key];
//     if (obj instanceof UNINITIALIZED_PRIMITIVE) {
//       (res as any)[key] = new SPrimitive(arg[key]);
//     }

//     // Act on initialized keys
//     obj = (res as any)[key];

//     if (obj instanceof SArray) {
//       (res.stateKeys as Map<string, any>).set(key, null);
//       const unsub = subscribe(obj, res._childChanged.bind(res));
//     }

//     if ((res as any)[key] instanceof SPrimitive) {
//       (res.stateKeys as Map<string, any>).set(key, null);
//       const unsub = subscribe(obj, res._childChanged.bind(res));
//     }
//   }
//   return res;
// }

export interface SState<T> {}

/** Describes an array */
export class SArray<
  T extends SState<unknown> | Struct<any>
> extends LinkedArray<T> {
  private schema: (SState<unknown> | typeof Struct)[];
  // private readonly schema: NWArray<NWInLax<SubOutLax<T>>>;
  // private container: SubContainer | null = null;

  constructor(schema: (SState<unknown> | typeof Struct)[], val: T[]) {
    super(val);
    // this.schema = schema;
    this.schema = schema;
    // for (const sub of subs) {
    //   if ("container" in sub) {
    //     sub.container = this;
    //   }
    // }

    // subscribe(this, () => {
    //   if (this.container !== null) {
    //     notify(this.container, null as any);
    //   }
    // });
  }

  // peek(): SubOut<T>[] {
  //   // TODO: when we make this a mutation hashable we wont have .subs and ._array any more
  //   // const res = this.subs.map((sub) => sub.peek());
  //   const res = this._getRaw().map((sub) => sub.peek());
  //   return res as any;
  // }

  // Implemented in SubArray
  // at(key: number): T | null {
  //   return this.subs[key] ?? null;
  // }
}

// class LinkedRecordDefinition<T extends Record<string, LS<unknown>>>
//   implements LS<{ [Key in keyof T]: NWOut<T[Key]> }>
// {
//   private def: T;
//   constructor(def: T) {
//     this.def = def;
//   }

//   create(value: { [Key in keyof T]: NWOut<T[Key]> }) {
//     return new LinkedRecord();
//   }

//   // TODO?
//   peek(): { [Key in keyof T]: NWOut<T[Key]> } {
//     throw new Error("Method not implemented.");
//   }
//   replace(v: { [Key in keyof T]: NWOut<T[Key]> }): void {
//     throw new Error("Method not implemented.");
//   }
//   _subscriptors: Set<StateChangeHandler<{ [Key in keyof T]: NWOut<T[Key]> }>> =
//     new Set();
// }

// class LinkedRecord<T extends Record<string, LS<unknown>>>
//   implements LS<{ [Key in keyof T]: NWOut<T[Key]> }>
// {
//   private def: T;
//   constructor(def: T) {
//     this.def = def;
//   }
//   peek(): { [Key in keyof T]: NWOut<T[Key]> } {
//     throw new Error("Method not implemented.");
//   }
//   replace(v: { [Key in keyof T]: NWOut<T[Key]> }): void {
//     throw new Error("Method not implemented.");
//   }
//   _subscriptors: Set<StateChangeHandler<{ [Key in keyof T]: NWOut<T[Key]> }>> =
//     new Set();
// }

function string(value?: string): SString {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : new SString(value);
}

function number(value: number): SNumber;
function number(value?: undefined): SNumber;
function number(value?: number): SPrimitive<number> {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : new SNumber(value);
}

function boolean(value: boolean) {
  return new SPrimitive(value);
}

function nil(value: null) {
  return new SPrimitive(value);
}

class Foo extends Struct<Foo> {}

type Constructor = new (...args: any[]) => any;

export type Instantiate<T> = T extends Constructor ? InstanceType<T> : T;

type X = Instantiate<typeof Foo | SNumber>;

function array<T extends SState<unknown> | typeof Struct>(
  schema: T[],
  val?: Instantiate<T>[]
  // schema: NWArray<NWInLax<SubOutLax<T>>>
): SArray<Instantiate<T>> {
  return val == null
    ? (new UNINITIALIZED_ARRAY(schema) as any)
    : new SArray(schema, val);
}
// function record<T extends Record<string, LS<any>>>(
//   schema: T
// ): LinkedRecordDefinition<T> {
//   return new LinkedRecordDefinition<T>(schema);
// }

// function union<T extends Array<SState<unknown>>>(
//   ...args: T
// ): NWUnion<T[number]> {
//   return new NWUnion<T[number]>(args);
// }

// function array<T extends SState<unknown>>(schema: T): NWArray<T> {
//   return new NWArray(schema);
// }

// function object<T extends Record<string, SState<unknown>>>(
//   schema: T
// ): NWObject<T> {
//   return new NWObject<T>(schema);
// }

// function map<T extends SState<unknown>>(map: { "[key: string]": T }): NWMap<T> {
//   return new NWMap(map["[key: string]"]);
// }

export {
  SBoolean,
  SNil,
  SNumber,
  SString,
  array,
  boolean,
  nil,
  number,
  string,
};
