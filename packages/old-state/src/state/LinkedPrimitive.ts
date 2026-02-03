import { nanoid } from "nanoid";
import { getGlobalState, saveForHistory } from "../sstate.history";
import { notify, Subbable, SubbableCallback } from "./Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "./SubbableContainer";
import { Contained } from "./Contained";

/**
 * LinkedState is a Subbable, a single atomic primitive
 */
export class LinkedPrimitive<S> implements Contained, Subbable {
  readonly _id: string;
  private _value: Readonly<S>;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  readonly _container = new Set<SubbableContainer>();

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
    // TODO: when merging Subbable and Contained, put this in `notify`
    notify(this, this);
    // TODO: add hash to subbable to just do subbableContainer._notifyChange(this, this);??
    // we don't need to save the token, since primitvies, being leaves, will never be notified when a child changes
    const token = new UpdateToken(this);
    for (const container of this._container) {
      subbableContainer._childChanged(container, token);
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
