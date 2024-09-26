import { nanoid } from "nanoid";
import { isContainable } from "./assertions";
import type { Contained, StateChangeHandler } from "./state/LinkedPrimitive";
import { MutationHashable } from "./state/MutationHashable";
import { SubbableContainer } from "./state/SubbableContainer";
import { Subbable, notify } from "./state/Subbable";
import { getGlobalState, saveForHistory } from "./sstate.history";

// export type AnyClass = {
//   new (...args: any[]): Struct<any>;
// };

type Struct2Serialized<T extends Constructable> = Readonly<
  ConstructorParameters<T>
>;

export abstract class Struct2<Sub extends Constructable>
  implements SubbableContainer, Subbable, Contained
{
  readonly _id: string;
  public _hash: number = 0;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  public _container = new Set<SubbableContainer>();
  public _propagatedTokens = new WeakSet();

  static readonly IGNORE_KEYS = new Set<string>([
    "_id",
    "_hash",
    "_subscriptors",
    "_container",
    "_propagatedTokens",
  ]);

  abstract serialize(): Struct2Serialized<Sub>;

  // TODO: a way to force constructor to be private in children, so that they don't
  // create objects with `new XXX` and instead use `create()`? built-in create as a static prop
  // might be good too.
  constructor() {
    this._id = nanoid(5);
    // We don't actually do anything here. create() initializes structs
  }

  _initConstructed(props: string[]) {
    const self = this as any;

    for (const key of props) {
      const child = self[key];
      SubbableContainer._contain(this, child);
    }
    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  protected _init() {
    const self = this as any;

    // todo, make htis more efficient than iterating throuhg all my props?
    // maybe with a close trick to see what gets initializded between Struct.super() and _init?
    // or something along those lines?
    for (const key in this) {
      const child = self[key];

      if (isContainable(self[key])) {
        child._container = this;
      }
    }

    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  // unnecesary?
  _destroy() {
    this._container.clear();
    // console.log("DESTROY", this);
  }

  featuredMutation(action: () => void) {
    saveForHistory(this);
    action();
    SubbableContainer._notifyChange(this, this);
  }
}

interface Constructable {
  new (...args: never[]): Struct2<any>;
  // _construct(json: T): Struct2<any>;
  // _simplify(): T;
}

export function create2<S extends Constructable>(
  Klass: S,
  ...args: ConstructorParameters<S>
): InstanceType<S> {
  const res = new Klass(...args) as any;
  res._init();
  return res;
}
