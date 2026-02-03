import { nanoid } from "nanoid";
import { getGlobalState, StructuredKind } from ".";
import { saveForHistory } from "./sstate.history";
import { notify, SubbableCallback } from "./state/Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "./state/SubbableContainer";

/**
 * SUnion holds a single Structured value. Accepts multiple kinds.
 * Also works as an "sreference".
 */
export class SUnion<S extends StructuredKind> implements SubbableContainer {
  readonly _id: string;
  private _value: S;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  readonly _container = new Set<SubbableContainer>();
  public _hash: number = 0;
  public readonly _propagatedTokens = new WeakSet<UpdateToken>();

  constructor(initialValue: S, id: string) {
    this._value = initialValue;
    this._id = id;
    const globalState = getGlobalState();
    globalState.knownObjects.set(this._id, this);
  }

  static of<T extends StructuredKind>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: S): void {
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

  get(): S {
    return this._value;
  }

  replace(value: S): void {
    this.set(value);
  }
}

export function union<S extends StructuredKind>(value: S) {
  return SUnion.of(value);
}

type Constructor<Name extends string, T extends unknown> = {
  _name: string;
  _value: T;
};

// const a = union<SString | SNumber>(string("foo"));
// a.set(number(2));
// const x = a.get();
