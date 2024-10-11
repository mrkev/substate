import { nanoid } from "nanoid";
import { ApplyDeserialization, NeedsSchema, Schema } from "./serialization";
import { getGlobalState, saveForHistory } from "./sstate.history";
import type { Contained, StateChangeHandler } from "./state/LinkedPrimitive";
import { Subbable } from "./state/Subbable";
import { SubbableContainer } from "./state/SubbableContainer";
import { PrimitiveKind, StructuredKind } from "./StructuredKinds";

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

// ConstructableStructure<any> instead of ConstructableStructure<S> because we acutally want it to take any params in the constructor, to allow for external arguments
// we use external arguments to pass in for example the liveAudioContext, which is not available just from the serialized json
export abstract class Structured<S, Sub extends ConstructableStructure<any>>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  public _hash: number = 0;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  public _container = new Set<SubbableContainer>();
  public _propagatedTokens = new WeakSet();

  abstract serialize(): S;
  abstract replace(json: S): void;
  abstract autoSimplify(): Record<string, StructuredKind | PrimitiveKind>;

  static IN_CREATE = false; // for debugging

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  protected constructor() {
    if (!Structured.IN_CREATE) {
      throw new Error(
        `Attempted to initialize a Structured object without using Structured.create`
      );
    }
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  static create<S, T extends ConstructableStructure<S>>(
    Klass: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    Structured.IN_CREATE = true;
    const res = new Klass(...args) as any;
    initStructured(res);
    Structured.IN_CREATE = false;
    return res;
  }

  public featuredMutation(action: () => void) {
    saveForHistory(this);
    action();
    SubbableContainer._notifyChange(this, this);
  }

  public notifyChange() {
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
