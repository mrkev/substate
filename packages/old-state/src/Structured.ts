import { nanoid } from "nanoid";
import { InitFunctions } from "./serialization/initialize";
import { ReplaceFunctions } from "./serialization/replace";
import {
  ApplyDeserialization,
  ApplySerialization,
  NeedsSchema,
  Schema,
} from "./serialization/serialization";
import { getGlobalState, saveForHistory } from "./sstate.history";
import type { Contained } from "./state/Contained";
import { Subbable, SubbableCallback } from "./state/Subbable";
import {
  subbableContainer,
  SubbableContainer,
} from "./state/SubbableContainer";
import { PrimitiveKind, StructuredKind } from "./StructuredKinds";

// export type AnyClass = {
//   new (...args: any[]): Struct<any>;
// };

type Struct2Serialized<S, T extends ConstructableStructure<any>> = Readonly<
  ConstructorParameters<T>
>;

type Structured_Static = typeof Structured;

export type DeserializeFunc = <M extends NeedsSchema, N extends Schema>(
  json: M,
  schema: N,
) => ApplyDeserialization<M>;

export interface ConstructableStructure<
  SAuto extends Record<string, StructuredKind | PrimitiveKind>,
  // ,Sub extends ConstructableStructure<any>
> {
  new (...args: never[]): Structured<SAuto, any>;
  construct(auto: SAuto, init: InitFunctions): Structured<SAuto, any>;
}

export type JSONOfAuto<
  SAuto extends Record<string, StructuredKind | PrimitiveKind>,
> = {
  [Property in keyof SAuto]: SAuto[Property] extends StructuredKind
    ? ApplySerialization<SAuto[Property]>
    : SAuto[Property];
};

// ConstructableStructure<any> instead of ConstructableStructure<S> because we acutally want it to take any params in the constructor, to allow for external arguments
// we use external arguments to pass in for example the liveAudioContext, which is not available just from the serialized json
export abstract class Structured<
  SAuto extends Record<string, StructuredKind | PrimitiveKind>,
  Sub extends ConstructableStructure<any>,
>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  public _hash: number = 0;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  readonly _container = new Set<SubbableContainer>();
  readonly _propagatedTokens = new WeakSet();

  abstract replace(
    autoJson: JSONOfAuto<SAuto>,
    replace: ReplaceFunctions,
  ): void;
  abstract autoSimplify(): SAuto;

  static IN_CREATE = false; // for debugging

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  constructor() {
    if (!Structured.IN_CREATE) {
      throw new Error(
        `Attempted to initialize a Structured object without using Structured.create`,
      );
    }
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  static create<T extends ConstructableStructure<any>>(
    Klass: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    Structured.IN_CREATE = true;
    const res = new Klass(...args);
    initStructured(res);
    Structured.IN_CREATE = false;
    return res as any;
  }

  public featuredMutation(action: () => void) {
    saveForHistory(this);
    action();
    subbableContainer._notifyChange(this, this);
  }

  public notifyChange() {
    subbableContainer._notifyChange(this, this);
  }
}

export function initStructured(structured: Structured<any, any>) {
  // todo, make this more efficient than iterating throuhg all my props?
  // maybe with a close trick to see what gets initializded between Struct.super() and _init?
  // or something along those lines?
  for (const key in structured) {
    const child = (structured as any)[key];
    subbableContainer._contain(structured, child);
  }
  const globalState = getGlobalState();
  globalState.knownObjects.set(structured._id, structured);
}
