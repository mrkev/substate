import { nanoid } from "nanoid";
import { Contained } from "../lib/Contained";
import { mutationHashable, MutationHashable } from "../lib/MutationHashable";
import { Subbable, SubbableCallback } from "../lib/Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "../lib/SubbableContainer";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;

// TODO: make this a condtainer? What's the use-case?

/**
 * LinkableValue is a Subbable holding a single atomic value
 */
export class LinkableValue<S> implements Subbable, Contained, MutationHashable {
  private _value: Readonly<S>;

  // Subbable
  public readonly _id: string;
  public readonly _subscriptors: Set<SubbableCallback> = new Set();

  // MutationHashable
  // Although LinkableValue can and usually works as normal state, we implement
  // MutationHashable so it's easy to use with useLink like other linked state
  _hash: number = 0;

  // Contained
  readonly _container = new Set<SubbableContainer>();

  private constructor(initialValue: S, id: string) {
    this._value = initialValue;
    this._id = id;
    // const globalState = getGlobalState();
    // globalState.knownObjects.set(this._id, this);
  }

  static create<T>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: Readonly<S>): void {
    // saveForHistory(this);
    this._value = value;

    // TODO: this._value = value; don't notify?
    // Now that LinkableValue is a MutationHashable, call this instead of `notify` directly
    mutationHashable.mutated(this, this);
    // notify(this, this);

    // We don't need to save the token, since primitvies, being leaves, will never be notified when a child changes
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
