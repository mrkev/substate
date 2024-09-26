import { nanoid } from "nanoid";
import { isContainable } from "./assertions";
import { ApplyDeserialization, NeedsSchema, Schema } from "./serialization";
import { getGlobalState, saveForHistory } from "./sstate.history";
import type { Contained, StateChangeHandler } from "./state/LinkedPrimitive";
import { MutationHashable } from "./state/MutationHashable";
import { Subbable } from "./state/Subbable";
import { SubbableContainer } from "./state/SubbableContainer";

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

export abstract class Structured<S, Sub extends ConstructableStructure<S>>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  public _hash: number = 0;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  public _container = new Set<SubbableContainer>();
  public _propagatedTokens = new WeakSet();

  abstract serialize(): S;
  abstract replace(json: S): void;

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  protected constructor() {
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  static create<S, T extends ConstructableStructure<S>>(
    Klass: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    const res = new Klass(...args) as any;
    initStructured(res);
    return res;
  }

  public featuredMutation(action: () => void) {
    saveForHistory(this);
    action();
    SubbableContainer._notifyChange(this, this);
  }
}

export function initStructured(structured: Structured<any, any>) {
  const self = structured as any;
  // todo, make this more efficient than iterating throuhg all my props?
  // maybe with a close trick to see what gets initializded between Struct.super() and _init?
  // or something along those lines?
  for (const key in structured) {
    const child = self[key];

    SubbableContainer._contain(structured, child);
  }
  const globalState = getGlobalState();
  globalState.knownObjects.set(structured._id, structured);
}
