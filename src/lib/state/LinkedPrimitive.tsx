import { nanoid } from "nanoid";
import { getGlobalState, saveForHistory } from "../../sstate.history";
import { SubbableContainer } from "./MutationHashable";
import { Subbable, notify } from "./Subbable";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
export type StateChangeHandler<S> = (value: S) => void;

export interface Contained {
  // todo: weak ref to avoid leaks
  // todo: readonly?
  _container: Subbable | null;
}

/**
 * LinkedState is a Subbable, a single atomic primitive
 */
export class LinkedPrimitive<S> implements Contained, Subbable {
  readonly _id: string;
  private _value: Readonly<S>;
  _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _container: SubbableContainer | null = null;

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
    if (this._container != null) {
      this._container._childChanged(this);
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