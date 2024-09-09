import { nanoid } from "nanoid";
import { isContainable } from "./assertions";
import type { Contained, StateChangeHandler } from "../state/LinkedPrimitive";
import { MutationHashable } from "../state/MutationHashable";
import { SubbableContainer } from "../state/SubbableContainer";
import { Subbable } from "../state/Subbable";
import { getGlobalState, saveForHistory } from "./sstate.history";
import { ApplyDeserialization, NeedsSchema, Schema } from "./serialization";

// export type AnyClass = {
//   new (...args: any[]): Struct<any>;
// };

type Struct2Serialized<S, T extends ConstructableStructure<S>> = Readonly<
  ConstructorParameters<T>
>;

type Structured_Static = typeof Structured;

export type DeserializeFunc = <M extends NeedsSchema, N extends Schema>(
  json: M,
  schema: N
) => ApplyDeserialization<M>;

interface ConstructableStructure<S> {
  new (...args: never[]): Structured<S, any>;
  construct(
    json: S,
    deserializeWithSchema: DeserializeFunc
  ): Structured<S, any>;
}

export const STRUCTURED_IGNORE_KEYS = new Set<string>([
  "_id",
  "_hash",
  "_subscriptors",
  "_container",
  "_cleanHash",
]);

export abstract class Structured<S, Sub extends ConstructableStructure<S>>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  public _hash: number = 0;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  public _container: SubbableContainer | null = null;

  abstract serialize(): S;
  abstract replace(json: S): void;

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  protected constructor() {
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  public _childChanged(child: Subbable) {
    MutationHashable.mutated(this, child);
    if (this._container != null) {
      this._container._childChanged(this);
    }
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

  static create<S, T extends ConstructableStructure<S>>(
    Klass: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    const res = new Klass(...args) as any;
    initStructured(res);
    return res;
  }

  // Dirty
  private _cleanHash: number = 0;
  _markClean() {
    // Anticipate the hash change from notificaiton
    this._cleanHash = (this._hash + 1) % Number.MAX_SAFE_INTEGER;
    this._notifyChange();
  }
  _isClean() {
    return this._cleanHash === this._hash;
  }
}

export function initStructured(structured: Structured<any, any>) {
  const self = structured as any;
  // todo, make htis more efficient than iterating throuhg all my props?
  // maybe with a close trick to see what gets initializded between Struct.super() and _init?
  // or something along those lines?
  for (const key in structured) {
    const child = self[key];

    if (isContainable(self[key])) {
      child._container = structured;
    }
  }
  const globalState = getGlobalState();
  globalState.knownObjects.set(structured._id, structured);
}
