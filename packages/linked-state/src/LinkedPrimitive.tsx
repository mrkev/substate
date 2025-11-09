import { nanoid } from "nanoid";
import { Contained } from "./Contained";
import { mutationHashable, MutationHashable } from "./MutationHashable";
import { Subbable } from "./Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "./SubbableContainer";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
export type StateChangeHandler<S> = (value: S) => void;

/**
 * LinkedPrimitive is a Subbable holding a single atomic value
 */
export class LinkedPrimitive<S>
  implements Subbable, Contained, MutationHashable
{
  readonly _id: string;
  private _value: Readonly<S>;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();

  // MutationHashable
  // Although linkedPrimitive can and usually works as normal state, we implement
  // MutationHashable so it's easy to use with useLink like other LinkedState
  _hash: number = 0;

  // Contained
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

    // TODO: this._value = value; don't notify?
    // Now that LinkedState is a MutationHashable, call this instead of `notify` directly
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
