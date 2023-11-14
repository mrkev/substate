//////// Schema ////////

import { nanoid } from "nanoid";
import { globalState } from "./sstate.history";
import { LinkedArray } from "./lib/state/LinkedArray";
import type {
  Contained,
  LS,
  StateChangeHandler,
} from "./lib/state/LinkedState";
import { SPrimitive } from "./lib/state/LinkedState";
import {
  MutationHashable,
  SubbableContainer,
} from "./lib/state/MutationHashable";
import { Subbable, notify } from "./lib/state/Subbable";
import { serialize } from "./sstate.serialization";

// todo? create -> of
class SString extends SPrimitive<string> {
  static create(val: string) {
    return SPrimitive.of(val);
  }
}
class SNumber extends SPrimitive<number> {
  static create(val: number) {
    return SPrimitive.of(val);
  }
}
class SBoolean extends SPrimitive<boolean> {
  static create(val: boolean) {
    return SPrimitive.of(val);
  }
}
class SNil extends SPrimitive<null> {
  static create(val: null) {
    return SPrimitive.of(val);
  }
}

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

type SPrimitiveFieldsToSOut<T extends Record<string, any>> = {
  [key in keyof T as T[key] extends SPrimitive<any> | SArray<any>
    ? key
    : never]: SOut<T[key]>;
};

type IntrinsicFields<T extends Record<string, any>> = Omit<
  {
    [key in keyof T as T[key] extends SPrimitive<any> | SArray<any>
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

  // private readonly _stateKeys: Map<keyof Child, null> = new Map();

  private _initConstructed(args: Record<string, any> | null) {
    if (args == null) {
      return;
    }

    const self = this as any;

    for (const key in args) {
      self[key] = args[key];
      const child = self[key];

      if (child instanceof SArray) {
        // (this._stateKeys as Map<string, any>).set(key, null);
        child._container = this;
        // todo ARG FOR ARRAY
      }

      if (child instanceof SPrimitive) {
        // (this._stateKeys as Map<string, any>).set(key, null);
        child._container = this;
      }
    }
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

    for (const key in args) {
      let child = self[key];
      if (child instanceof UNINITIALIZED_PRIMITIVE) {
        self[key] = SPrimitive.of(args[key]);
      }

      if (child instanceof UNINITIALIZED_ARRAY) {
        self[key] = new SArray(child.schema, args[key], nanoid(5));
      }

      // Act on initialized keys
      child = self[key];

      if (child instanceof SArray) {
        child._container = this;
        // todo ARG FOR ARRAY
      }

      if (child instanceof SPrimitive) {
        child._container = this;
      }
    }
    globalState.knownObjects.set(this._id, this);
  }

  _childChanged(child: Subbable) {
    MutationHashable.mutated(this);
    notify(this, child);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  // unnecesary?
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
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  serialize() {
    return JSON.stringify(this, null, 2);
  }

  static readonly IGNORE_KEYS = new Set<string>([
    "_hash",
    "_subscriptors",
    "_container",
    "_stateKeys",
    "_unsub",
    "_id",
  ]);

  toJSON() {
    // const result: Record<any, any> = { _kind: this._kind };
    const result: Record<string, unknown> = {};
    const keys = Object.keys(this);

    for (const key of keys) {
      if (Struct.IGNORE_KEYS.has(key)) {
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

  mutate(action: () => void) {
    if (
      globalState.HISTORY_RECORDING != false &&
      // save orignal only. We might make multiple operations on this data structure
      globalState.HISTORY_RECORDING.get(this._id) == null
    ) {
      const serialized = serialize(this);
      // console.log("SAVING", this._id, "with value", serialized);
      globalState.HISTORY_RECORDING.set(this._id, serialized);
    }

    action();

    MutationHashable.mutated(this);
    notify(this, this);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  _notifyReplaced() {
    MutationHashable.mutated(this);
    notify(this, this);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }
}

type AnyClass = {
  new (...args: any[]): Struct<any>;
};

type OneArgClass = {
  new (arg1: any): Struct<any>;
};

type TwoArgClass = {
  new (arg1: any, arg2: any): Struct<any>;
};

type SecondConstructorParam<T> = T extends {
  new (arg1: any, arg2: infer U): Struct<any>;
}
  ? U
  : null;

// class Foo extends Struct<Foo> {
//   name = string();
//   hello: number;
//   foo = 3;

//   constructor(props: StructProps<Foo, { hello: number }>) {
//     super(props);
//     this.hello = props.hello;
//   }
// }

// class Bar extends Struct<Foo> {
//   name = string();
//   foo = 3;
// }

// const foo = create(Foo, { name: "hello", hello: 3 });
// const bar = create(Bar, { name: "hello" });

export type StructProps<
  T extends Struct<any>,
  U extends Record<string, any>
> = SPrimitiveFieldsToSOut<T> & U;

type ConstructorArguments<T extends AnyClass> = T extends OneArgClass
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
  _schema: (SState<unknown> | typeof Struct)[];
  // private readonly schema: NWArray<NWInLax<SubOutLax<T>>>;
  // private container: SubContainer | null = null;

  constructor(
    schema: (SState<unknown> | typeof Struct)[],
    val: T[],
    id: string
  ) {
    super(val, id);
    // this.schema = schema;
    this._schema = schema;
    globalState.knownObjects.set(this._id, this);
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
    : SString.of(value);
}

function number(value?: number): SPrimitive<number> {
  return value == null
    ? (new UNINITIALIZED_PRIMITIVE() as any)
    : SNumber.of(value);
}

function boolean(value: boolean) {
  return SPrimitive.of(value);
}

function nil(value: null) {
  return SPrimitive.of(value);
}

type Constructor = new (...args: any[]) => any;
export type Instantiate<T> = T extends Constructor ? InstanceType<T> : T;

// type X = Instantiate<typeof Foo | SNumber>;

function array<T extends SState<unknown> | typeof Struct>(
  schema: T[],
  val?: Instantiate<T>[]
  // schema: NWArray<NWInLax<SubOutLax<T>>>
): SArray<Instantiate<T>> {
  return val == null
    ? (new UNINITIALIZED_ARRAY(schema) as any)
    : new SArray(schema, val, nanoid(5));
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
