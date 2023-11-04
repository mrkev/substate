import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { MutationHashable, SubbableContainer } from "./MutationHashable";
import { Subbable, notify, subscribe } from "./Subbable";
import { globalState } from "../sstate.history";
import { serialize } from "../sstate.serialization";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
export type StateChangeHandler<S> = (value: S) => void;

export interface Contained {
  _container: Subbable | null;
}

export interface LS<T> extends Subbable, Contained {
  peek(): T;
  replace(v: T): void;
}

/**
 * LinkedState is a Subbable, a single atomic primitive
 */
export class SPrimitive<S> implements LS<S> {
  readonly _id: string;
  private _value: Readonly<S>;
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _container: SubbableContainer | null = null;

  constructor(initialValue: S, id: string) {
    this._value = initialValue;
    this._id = id;
    globalState.knownObjects.set(this._id, this);
  }

  static of<T>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: Readonly<S>): void {
    if (
      globalState.HISTORY_RECORDING != false &&
      // save orignal only. We might make multiple operations on this data structure
      globalState.HISTORY_RECORDING.get(this._id) == null
    ) {
      const serialized = serialize(this);
      console.log("SAVING", this._id, "with value", serialized);
      globalState.HISTORY_RECORDING.set(this._id, serialized);
    }

    this._value = value;
    notify(this, this);
    if (this._container != null) {
      // NOTE: is notify the right way to do it? is isn't changing the hash.
      this._container._childChanged(this);
    }
  }

  setDyn(cb: (prevState: S) => S) {
    const newVal = cb(this.get());
    this.set(newVal);
  }

  get(): Readonly<S> {
    return this._value;
  }

  peek(): Readonly<S> {
    return this.get();
  }

  replace(value: Readonly<S>): void {
    this.set(value);
  }

  toJSON() {
    return {
      _value: this._value,
      _id: this._id,
    };
  }
}

export function useLinkedState<S>(
  linkedState: SPrimitive<S>
): [S, StateDispath<S>] {
  const [state, setState] = useState<S>(() => linkedState.get());

  useEffect(() => {
    return subscribe(linkedState, () => {
      setState(() => linkedState.get());
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

/////////// NOT DONE OR USED ///////////////

// type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// LinkedMap X
// LinkedArray X
// LinkedSet X
// LinkedRecord (TODO)
// - Keys don't change
// - Listens to changes of keys
// - is this just automatically creating a map of string -> LinkedState?

type LSIn<T> =
  // primitives
  T extends number | string | boolean
    ? SPrimitive<T>
    : // Records
    T extends Record<string, infer U>
    ? { [Key in keyof T]: SOut<U> }
    : never;

type SOut<T> = // primitives
  T extends SPrimitive<infer P>
    ? P
    : // Records
    T extends SRecord<infer E>
    ? { [Key in keyof E]: SOut<E[Key]> }
    : never;

class SRecord<TSchema extends Record<string, LS<any>>>
  implements
    LS<{ [Key in keyof TSchema]: SOut<TSchema[Key]> }>,
    MutationHashable
{
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _hash: number = 0;
  _container: Subbable | null = null;

  schema: TSchema;
  constructor(schema: TSchema) {
    this.schema = schema;
  }

  peek(): { [Key in keyof TSchema]: SOut<TSchema[Key]> } {
    const entries = Object.entries(this.schema).map(([key, value]) => {
      return [key, value.peek()];
    });
    return Object.fromEntries(entries);
  }

  child<K extends keyof TSchema>(key: K): TSchema[K] {
    // We add a check because this is usued dynamically in 'browse'
    if (!(key in this.schema)) {
      throw new Error(
        `${this.constructor.name}: no key ${String(
          key
        )} found. Keys: ${Object.keys(this.schema)}`
      );
    }
    return this.schema[key];
  }

  browse(browseCB: (b: BrowserTarget<SRecord<TSchema>>) => void) {
    const target = { __path: [] };
    const browser: any = new Proxy<{ __path: string[] }>(target, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === "symbol") {
          throw new Error("TODO CANT SYMBOL");
        }
        target.__path.push(prop);
        return browser;
      },
    });

    browseCB(browser);

    let result = this;
    for (const key of target.__path) {
      result = result.child(key) as any;
    }

    return result;
  }

  replace(_v: { [Key in keyof TSchema]: SOut<TSchema[Key]> }) {
    throw new Error("not implemented");
  }
}

type BrowserTarget<T extends LS<any>> =
  // Records
  T extends SRecord<infer E>
    ? { [Key in keyof E]: BrowserTarget<E[Key]> }
    : // Primitives
    T extends SPrimitive<any>
    ? void
    : never;

// a.browse((a) => a.park.animals.lions);
// (window as any).a = a;

// a.child("here");
// a.browse((foo) => foo.here.there);

/////////////

// const zoo = record({
//   animals: record({
//     penguins: number(3),
//     tigers: number(2),
//   }),
//   ticketSales: number(2),
// });

// zoo.push();

// function Foo() {
//   const [value] = observe(zoo.animals.penguins);
// }
