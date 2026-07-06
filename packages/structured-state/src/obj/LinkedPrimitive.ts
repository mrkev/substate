import { nanoid } from "nanoid";
import { getGlobalState, saveForHistory } from "../sstate.history";
import { Contained } from "../state/Contained";
import { MutationHashable } from "../state/MutationHashable";
import { Subbable, SubbableCallback } from "../state/Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "../state/SubbableContainer";

/**
 * LinkedState is a Subbable, a single atomic primitive
 */
export class LinkedPrimitive<S>
  // TODO: merge subbable and Contained
  implements Contained, Subbable, MutationHashable, SubbableContainer
{
  readonly _id: string;
  public _hash: number = 0;

  private _value: Readonly<S>;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  readonly _container = new Set<SubbableContainer>();
  readonly _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  constructor(initialValue: S, id: string) {
    this._value = initialValue;
    this._id = id;
    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  static of<T>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: Readonly<S>): void {
    saveForHistory(this);
    this._value = value;
    subbableContainer._notifyChange(this, this);
  }

  setDyn(cb: (prevState: S) => S) {
    const newVal = cb(this.get());
    this.set(newVal);
  }

  get(): Readonly<S> {
    return this._value;
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
