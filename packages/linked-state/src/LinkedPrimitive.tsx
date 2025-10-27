import { nanoid } from "nanoid";
import { Subbable, notify } from "./Subbable";
import { SubbableContainer, UpdateToken } from "./SubbableContainer";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
export type StateChangeHandler<S> = (value: S) => void;

export interface Contained {
  readonly _container: Set<Subbable>;
}

/**
 * LinkedState is a Subbable, a single atomic primitive
 */
export class LinkedPrimitive<S> implements Contained, Subbable {
  readonly _id: string;
  private _value: Readonly<S>;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  readonly _container = new Set<SubbableContainer>();

  private constructor(initialValue: S, id: string) {
    this._value = initialValue;
    this._id = id;
    // const globalState = getGlobalState();
    // globalState.knownObjects.set(this._id, this);
  }

  static of<T>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: Readonly<S>): void {
    // saveForHistory(this);
    this._value = value;
    // TODO: when merging Subbable and Contained, put this in `notify`
    notify(this, this);
    // TODO: add hash to subbable to just do SubbableContainer._notifyChange(this, this);??
    // we don't need to save the token, since primitvies, being leaves, will never be notified when a child changes
    const token = new UpdateToken(this);
    for (const container of this._container) {
      SubbableContainer._childChanged(container, token);
    }
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
