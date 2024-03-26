import { StateChangeHandler } from "./LinkedPrimitive";
import { MutationHashable } from "./MutationHashable";
import { Subbable } from "./Subbable";

// TODO: SubbableContainer, Contained
export class LinkedSet<S> implements Set<S>, Subbable, MutationHashable {
  private _set: ReadonlySet<S>;

  _subscriptors = new Set<StateChangeHandler<Subbable>>();
  _hash: number = 0;

  private constructor(initialValue: Set<S>) {
    this._set = initialValue;
  }

  _getRaw(): ReadonlySet<S> {
    return this._set;
  }

  _setRaw(set: ReadonlySet<S>) {
    this._set = set;
    MutationHashable.mutated(this, this);
  }

  public static create<T>(initialValue?: Set<T>) {
    return new this<T>(initialValue ?? new Set());
  }

  private mutate<V>(mutator: (clone: Set<S>) => V): V {
    const result = mutator(this);
    MutationHashable.mutated(this, this);
    return result;
  }

  // In some future, create a set that does several operations at once
  // set(mutator: (clone: Set<S>) => V): V {
  // }
  // Set<S> interface, mutates
  add(value: S): this {
    if (this._set.has(value)) {
      return this;
    }
    return this.mutate((clone) => {
      clone.add(value);
      return this;
    });
  }

  // Set<S> interface, mutates
  clear(): void {
    this._set = new Set();
    MutationHashable.mutated(this, this);
  }

  // Set<S> interface, mutates
  delete(value: S): boolean {
    if (!this._set.has(value)) {
      return false;
    }

    return this.mutate((clone) => {
      return clone.delete(value);
    });
  }

  // Set<S> interface
  forEach(
    _callbackfn: (value: S, value2: S, set: Set<S>) => void,
    _thisArg?: any
  ): void {
    throw new Error("Method not implemented.");
  }

  // Set<S> interface
  has(value: S): boolean {
    return this._set.has(value);
  }

  // Set<S> interface
  get size() {
    return this._set.size;
  }

  // Set<S> interface
  entries(): IterableIterator<[S, S]> {
    return this._set.entries();
  }

  // Set<S> interface
  keys(): IterableIterator<S> {
    return this._set.keys();
  }

  // Set<S> interface
  values(): IterableIterator<S> {
    return this._set.values();
  }

  // Set<S> interface
  [Symbol.iterator](): IterableIterator<S> {
    return this._set[Symbol.iterator]();
  }

  // Set<S> interface, TODO
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
