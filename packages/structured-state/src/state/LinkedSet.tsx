import { nanoid } from "nanoid";
import { SubbableContainer } from "./SubbableContainer";

// TODO: missing: history
export class SSet<S> extends SubbableContainer implements Set<S> {
  private _set: ReadonlySet<S>;

  private constructor(initialValue: Set<S>, id: string) {
    super(id);
    this._set = initialValue;
    SubbableContainer._containAll(this, this._set);
  }

  _getRaw(): ReadonlySet<S> {
    return this._set;
  }

  _setRaw(set: ReadonlySet<S>) {
    SubbableContainer._uncontainAll(this, this._set);
    this._set = set;
    SubbableContainer._containAll(this, set);
    SubbableContainer._notifyChange(this, this);
  }

  // TODO: method to initialize with id to make it unexposed to caller?
  // or should I just use the constructor and the existence of `s.set()` make having `SSet.create` redundant.
  public static create<T>(initialValue?: Set<T>, id?: string) {
    return new this<T>(initialValue ?? new Set(), id ?? nanoid(5));
  }

  private mutate<V>(mutator: (raw: Set<S>) => V): V {
    const result = mutator(this._set as any);
    SubbableContainer._notifyChange(this, this);
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
      SubbableContainer._containAll(this, [value]);
      clone.add(value);
      return this;
    });
  }

  // Set<S> interface, mutates
  clear(): void {
    for (const elem of this._set) {
      SubbableContainer._uncontain(this, elem);
    }
    // To trigger everything that should be triggered
    this.mutate(() => {});
    this._set = new Set();
  }

  // Set<S> interface, mutates
  delete(value: S): boolean {
    if (!this._set.has(value)) {
      return false;
    }

    return this.mutate((raw) => {
      // NOTE: We have confirmed above the set has this value
      SubbableContainer._uncontain(this, value);
      return raw.delete(value);
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
  union<U>(other: ReadonlySetLike<U>): Set<S | U> {
    return this._set.union(other);
  }

  // Set<S> interface
  intersection<U>(other: ReadonlySetLike<U>): Set<S & U> {
    return this._set.intersection<U>(other);
  }

  // Set<S> interface
  difference<U>(other: ReadonlySetLike<U>): Set<S> {
    return this._set.difference<U>(other);
  }

  // Set<S> interface
  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<S | U> {
    return this._set.symmetricDifference<U>(other);
  }

  // Set<S> interface
  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    return this._set.isSubsetOf(other);
  }

  // Set<S> interface
  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    return this._set.isSupersetOf(other);
  }

  // Set<S> interface
  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    return this._set.isDisjointFrom(other);
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
