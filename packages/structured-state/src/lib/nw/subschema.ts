import { useCallback, useEffect, useMemo, useState } from "react";
import { LinkedArray } from "../state/LinkedArray";
import { StateChangeHandler, StateDispath } from "../state/LinkedPrimitive";
import { MutationHashable } from "../state/MutationHashable";
import { Subbable, notify, subscribe } from "../state/Subbable";
import { exhaustive } from "../../assertions";
import * as nw from "./nwschema";
import {
  NWArray,
  NWBoolean,
  NWNil,
  NWNumber,
  NWSchema,
  NWString,
  NWUnion,
} from "./nwschema";
import { NWInLax, NWInUnion, NWOut } from "./nwschema.types";
import { SubInLax, SubInLaxUnion, SubOut, SubOutLax } from "./subschema.types";
import { nanoid } from "nanoid";

//////// Schema ////////

type AllSubs =
  | SubString
  | SubNumber
  | SubBoolean
  | SubNil
  | SubUnion<any>
  | SubMap<any>
  | SubArray<any>
  | SubObject<any>;

export function concretize(schema: NWString, value: string): SubString;
export function concretize(schema: NWNumber, value: number): SubNumber;
export function concretize(schema: NWBoolean, value: boolean): SubBoolean;
export function concretize(schema: NWNil, value: null): SubNil;
export function concretize(
  schema: NWString | NWNumber | NWBoolean | NWNil,
  value: string | number | boolean | null
): SubString | SubNumber | SubBoolean | SubNil {
  if (schema instanceof NWString) {
    const str = schema.expect(value);
    return new SubString(str, schema, null);
  }

  if (schema instanceof NWNumber) {
    const str = schema.expect(value);
    return new SubNumber(str, schema, null);
  }

  if (schema instanceof NWBoolean) {
    const str = schema.expect(value);
    return boolean(str);
  }

  if (schema instanceof nw.NWNil) {
    const str = schema.expect(value);
    return nil(str);
  }

  exhaustive(schema);
}

export interface SubSchema<T> {
  peek(): T;
}

// function peek(sub: SubString): string;
// function peek(sub: SubNumber): number;
// function peek(sub: SubBoolean): boolean;
// function peek(sub: SubNil): null;
// function peek<T extends SubSchema<any>>(sub: SubUnion<T>): SubOut<SubUnion<T>>;
// function peek<T extends SubSchema<any>>(sub: SubMap<T>): string;
// function peek<T extends SubSchema<any>>(sub: SubArray<T>): string;
// function peek<T extends Record<string, SubSchema<unknown>>>(sub: SubObject<T>): string;
// function peek<T extends SubSchema<any>>(sub: AllSubs): T {
//   if (sub instanceof SubString) {
//     return sub.peek();
//   }
//   exhaustive(sub);
// }

///////// TODO: child has reference to parent so
///////// sub-string can notify sub-object
///////// we dont want parent to child so theres no memory leaks
///////// make sure when child is removed from a collection to remove reference to parent then right? is this necessary? if we keep the child around the parent will too otherwise?
type SubContainer = SubObject<any>; // todo: remove null

/** Describes a string */
class SubString implements SubSchema<string>, SubbableState<string> {
  // interface SubbableState
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();

  private val: string;
  private readonly schema: NWString;
  private readonly _container: SubContainer | null;

  constructor(val: string, schema: NWString, container: SubContainer | null) {
    this.val = val;
    this.schema = schema;
    this._container = container;
  }

  get(): string {
    return this.peek();
  }

  set(val: string) {
    this.val = val;
    notify(this, this);
    if (this._container != null) {
      // NOTE: is notify the right way to do it? is isn't changing the hash.
      MutationHashable.mutated(this._container, this);
    }
  }

  peek(): string {
    return this.val;
  }

  replace(val: unknown) {
    const result = this.schema.consume(val);
    switch (result.status) {
      case "failure":
        throw result.error;
      case "success":
        this.val = result.value;
    }
  }
}

/** Describes a number */
class SubNumber implements SubSchema<number>, SubbableState<number> {
  // interface SubbableState
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();

  private val: number;
  private readonly schema: NWNumber;
  private readonly _container: SubContainer | null;
  constructor(val: number, schema: NWNumber, container: SubContainer | null) {
    this.val = val;
    this.schema = schema;
    this._container = container;
  }

  get(): number {
    return this.val;
  }

  set(val: number) {
    this.val = val;
    notify(this, this);
    if (this._container != null) {
      MutationHashable.mutated(this._container, this);
    }
  }

  setDyn(cb: (prevState: number) => number) {
    const newVal = cb(this.get());
    this.set(newVal);
  }

  peek(): number {
    return this.val;
  }
}

/** Describes a boolean */
class SubBoolean implements SubSchema<boolean> {
  private val: boolean;
  private readonly schema: NWBoolean;
  constructor(val: boolean, schema: NWBoolean) {
    this.val = val;
    this.schema = schema;
  }

  peek(): boolean {
    return this.val;
  }

  set(val: boolean) {
    this.val = val;
  }
}

/** Describes null, undefined, void */
class SubNil implements SubSchema<null> {
  private val: null;
  private readonly schema: nw.NWNil;
  constructor(value: null, schema: nw.NWNil) {
    this.val = value;
    this.schema = schema;
  }

  peek(): null {
    return this.val;
  }

  set(val: null) {
    this.val = val;
  }
}

// function union<Opts extends NWSchema<unknown>>(
//   sub: SubInUnion<NWOut<Opts>>,
//   schema: NWUnion<Opts>
// ): SubUnion<SubInUnion<NWOut<Opts>>> {
//   return new SubUnion<SubInUnion<NWOut<Opts>>>(sub, schema);
// }

/** Describes a union of several types; resolves to the first successful one */
class SubUnion<T extends SubSchema<any>> implements SubSchema<SubOut<T>> {
  subValue: T;
  readonly schema: NWUnion<NWInUnion<SubOutLax<T>>>;
  constructor(subValue: T, schema: NWUnion<NWInUnion<SubOutLax<T>>>) {
    this.subValue = subValue;
    this.schema = schema;
  }

  peek(): SubOut<T> {
    return this.subValue.peek();
  }

  set(val: SubOut<T>) {
    // Iterate through every option in schema
    // First one that can be concretized is it

    // if (this.subValue instanceof SubNumber) {
    //   if (typeof val !== "number") {
    //     throw new Error("invalid type");
    //   }
    //   this.subValue.set(val);
    // } else if (this.subValue instanceof SubString) {
    //   if (typeof val !== "string") {
    //     throw new Error("invalid type");
    //   }
    //   this.subValue.set(val);
    // } else if (this.subValue instanceof SubBoolean) {
    //   if (typeof val !== "boolean") {
    //     throw new Error("invalid type");
    //   }
    //   this.subValue.set(val);
    // } else if (this.subValue instanceof SubNil) {
    //   if (val !== null) {
    //     throw new Error("invalid type");
    //   }
    //   this.subValue.set(val);
    // } else if (this.subValue instanceof SubArray) {
    //   throw new Error("TODO");
    // } else if (this.subValue instanceof SubMap) {
    //   throw new Error("TODO");
    // } else if (this.subValue instanceof SubObject) {
    //   throw new Error("TODO");
    // } else if (this.subValue instanceof SubUnion) {
    //   throw new Error("TODO");
    // } else {
    //   throw new Error("Unknown SubSchema for union");
    // }

    // TODO: GOTTA REPLACE.
    if (typeof this.subValue.peek() === typeof val) {
      // this.subValue.set()
      // SET
    } else {
      // REPLACLE
    }
    throw new Error("NOT IMPLEMENTED");
  }
}

/** Describes an array */
class SubArray<T extends SubSchema<unknown>>
  extends LinkedArray<T>
  implements SubSchema<SubOut<T>[]>
{
  private subs: T[];
  private readonly schema: NWArray<NWInLax<SubOutLax<T>>>;

  constructor(subs: T[], schema: NWArray<NWInLax<SubOutLax<T>>>) {
    super(subs, nanoid(5));
    this.schema = schema;
    this.subs = subs;
    for (const sub of subs) {
      if ("_container" in sub) {
        sub._container = this;
      }
    }
  }

  peek(): SubOut<T>[] {
    // TODO: when we make this a mutation hashable we wont have .subs and ._array any more
    // const res = this.subs.map((sub) => sub.peek());
    const res = this._getRaw().map((sub) => sub.peek());
    return res as any;
  }

  // Implemented in SubArray
  // at(key: number): T | null {
  //   return this.subs[key] ?? null;
  // }
}

/** Describes an object with known keys */
class SubObject<TSub extends Record<string, SubSchema<unknown>>>
  implements
    SubSchema<{ [Key in keyof TSub]: SubOut<TSub[Key]> }>,
    SubbableHashedState<{ [Key in keyof TSub]: SubOut<TSub[Key]> }>
{
  private readonly schema: nw.NWObject<{
    [Key in keyof TSub]: NWInLax<SubOutLax<TSub[Key]>>;
  }>;
  private readonly sub: TSub;
  private _container: SubContainer | null = null;

  // SubbableHashedState interface
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _hash: number = 0;

  _getRaw(): { [Key in keyof TSub]: SubOut<TSub[Key]> } {
    return this.peek();
  }
  _setRaw(v: { [Key in keyof TSub]: SubOut<TSub[Key]> }): void {
    for (const key in v) {
      const sub = this.sub[key];
      // sub.set(...)
      // console.log("TODO, set", key, ":", v[key]);
    }

    // .set above returns changed. Only notify on changed
    notify(this, this);
  }

  constructor(
    subs: TSub,
    schema: nw.NWObject<{ [Key in keyof TSub]: NWInLax<SubOutLax<TSub[Key]>> }>
  ) {
    this.schema = schema;
    this.sub = subs;
    for (const key in subs) {
      const sub = subs[key];
      if ("_container" in sub) {
        sub._container = this;
      }
    }

    subscribe(this, () => {
      console.log(
        `SUBOBJ: {${Object.keys(this.sub)}} notify parent ${this._container}`
      );
      if (this._container != null) {
        notify(this._container, this);
      }
    });
  }

  peek(): { [Key in keyof TSub]: SubOut<TSub[Key]> } {
    const record: any = {};

    for (const key in this.sub) {
      const value = this.sub[key].peek();

      record[key] = value as any;
    }
    return record;
  }

  at<K extends keyof TSub>(key: K): TSub[K] {
    return this.sub[key];
  }
}

class SubMap<T extends SubSchema<unknown>>
  implements SubSchema<Record<string, SubOut<T>>>
{
  private readonly schema: nw.NWMap<NWInLax<SubOutLax<T>>>;
  protected subs: Record<string, T>;
  constructor(
    subs: Record<string, T>,
    schema: nw.NWMap<NWInLax<SubOutLax<T>>>
  ) {
    this.schema = schema;
    this.subs = subs;
  }

  peek(): Record<string, SubOut<T>> {
    const record: Record<string, SubOut<T>> = {};
    for (const key in this.subs) {
      const value = this.subs[key].peek();
      record[key] = value as any;
    }
    return record;
  }

  // set(val: Record<string, NWOut<NWInLax<SubOutLax<T>>>>) {
  //   const newSub = this.schema.concretize(val);
  //   this.subs = newSub.subs;
  // }

  at(key: string): T | null {
    return this.subs[key] ?? null;
  }
}

//////// Constructors  ////////

function string(val: string) {
  return new SubString(val, nw.string(), null);
}

function number(val: number) {
  return new SubNumber(val, nw.number(), null);
}

function boolean(val: boolean) {
  return new SubBoolean(val, nw.boolean());
}

function nil(val: null) {
  return new SubNil(val, nw.nil());
}

export type NWUnionOptsToSubOpts<Opts extends NWSchema<any>> = SubInLaxUnion<
  NWOut<Opts>
>;

/* We extend on NWSchema because only the schema has all the
 * options. The sub has just the current value.
 */
function union<Opts extends NWSchema<any>>(
  sub: NWUnionOptsToSubOpts<Opts>,
  schema: NWUnion<Opts>
): SubUnion<NWUnionOptsToSubOpts<Opts>> {
  // TODO
  return new SubUnion<NWUnionOptsToSubOpts<Opts>>(sub, schema as any);
}

function object<T extends Record<string, SubSchema<unknown>>>(
  sub: T,
  // schema: NWInLax<SubOutLax<SubObject<T>>>
  schema: nw.NWObject<{ [Key in keyof T]: NWInLax<SubOutLax<T[Key]>> }>
): SubObject<T> {
  return new SubObject<T>(sub, schema);
}

function map<T extends SubSchema<unknown>>(
  sub: Record<string, T>,
  schema: nw.NWMap<NWInLax<SubOutLax<T>>>
): SubMap<T> {
  return new SubMap<T>(sub, schema);
}

function array<T extends SubSchema<unknown>>(
  sub: T[],
  schema: NWArray<NWInLax<SubOutLax<T>>>
): SubArray<T> {
  return new SubArray(sub, schema);
}

export {
  SubArray,
  SubBoolean,
  SubMap,
  SubNil,
  SubNumber,
  SubObject,
  SubString,
  SubUnion,
  array,
  boolean,
  map,
  nil,
  number,
  object,
  string,
  union,
};

export type infer<T extends SubSchema<unknown>> = SubOut<T>;
export type Concretized<T extends NWSchema<unknown>> = SubInLax<NWOut<T>>;

///////////////////////////////////////////////////////////////////////////////

export interface SubbableState<T> extends Subbable {
  get(): T;
  set(v: T): void;
}

export interface SubbableHashedState<T> extends Subbable, MutationHashable {
  _getRaw(): T;
  _setRaw(v: T): void;
}

export function useSubbable<S>(
  linkedState: SubbableState<S>
): [S, StateDispath<S>] {
  const [state, setState] = useState<S>(() => linkedState.get());

  useEffect(() => {
    return subscribe(linkedState, (target) => {
      if (target === linkedState) {
        setState(() => linkedState.get());
      }
    });
  }, [linkedState]);

  const apiState = linkedState.get();
  useEffect(() => {
    setState(() => apiState);
  }, [apiState]);

  const setter: StateDispath<S> = useCallback(
    (newVal) => {
      // newVal instanceof Function
      if (newVal instanceof Function) {
        linkedState.set(newVal(linkedState.get()));
      } else {
        linkedState.set(newVal);
      }
    },
    [linkedState]
  );

  return [state, setter];
}

export function useSubToObjectCached<K>(obj: SubbableHashedState<K>): K {
  const [hash, setHash] = useState(() => MutationHashable.getMutationHash(obj));

  const value = useMemo(() => {
    void hash; // bc we depend on it and we dont want eslint to yell
    return obj._getRaw();
  }, [obj, hash]);

  useEffect(() => {
    return subscribe(obj, (target) => {
      if (obj === target) {
        setHash((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
      }
    });
  }, [obj]);

  return value;
}
