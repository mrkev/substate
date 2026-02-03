import { nanoid } from "nanoid";
import { mutableset } from "../lib/nullthrows";
import { getGlobalState, saveForHistory } from "../sstate.history";
import { StructSchema } from "../StructuredKinds";
import { subbableContainer, SubbableContainer } from "./SubbableContainer";

export class SSet<S> extends SubbableContainer implements Set<S> {
  private _set: ReadonlySet<S>;
  public _schema: StructSchema | null;

  constructor(_set: Set<S>, _id: string, _schema: StructSchema | null) {
    super(_id);
    this._set = _set;
    this._schema = _schema;
    subbableContainer._containAll(this, this._set);
    getGlobalState().knownObjects.set(this._id, this);
  }

  _getRaw(): ReadonlySet<S> {
    return this._set;
  }

  _setRaw(set: ReadonlySet<S>) {
    subbableContainer._uncontainAll(this, this._set);
    this._set = set;
    subbableContainer._containAll(this, set);
    subbableContainer._notifyChange(this, this);
  }

  /** should only be used internally */
  public static _create<T>(
    initialValue?: Iterable<T>,
    id?: string,
    schema?: StructSchema | null,
  ) {
    return new this<T>(
      initialValue instanceof Set ? initialValue : new Set(initialValue),
      id ?? nanoid(5),
      schema ?? null,
    );
  }

  private mutate<V>(mutator: (raw: Set<S>) => V): V {
    saveForHistory(this);
    const result = mutator(mutableset(this._set));
    subbableContainer._notifyChange(this, this);
    return result;
  }

  _replace(cb: (set: Set<S>) => ReadonlySet<S>) {
    // todo, call ._destroy on child elements?
    subbableContainer._uncontainAll(this, this._set);
    this._set = cb(mutableset(this._set));
    subbableContainer._containAll(this, this._set);
    subbableContainer._notifyChange(this, this);
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
      subbableContainer._containAll(this, [value]);
      clone.add(value);
      return this;
    });
  }

  // Set<S> interface, mutates
  clear(): void {
    for (const elem of this._set) {
      subbableContainer._uncontain(this, elem);
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
      subbableContainer._uncontain(this, value);
      return raw.delete(value);
    });
  }

  // Set<S> interface
  forEach(
    _callbackfn: (value: S, value2: S, set: Set<S>) => void,
    _thisArg?: any,
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
  entries(): SetIterator<[S, S]> {
    return this._set.entries();
  }

  // Set<S> interface
  keys(): SetIterator<S> {
    return this._set.keys();
  }

  // Set<S> interface
  values(): SetIterator<S> {
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
  [Symbol.iterator](): SetIterator<S> {
    return this._set[Symbol.iterator]();
  }

  // Set<S> interface
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

  // non-standard

  map<U>(callbackfn: (value: S) => U): U[] {
    const result = [];
    for (const value of this.values()) {
      result.push(callbackfn(value));
    }
    return result;
  }
}
