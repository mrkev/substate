import { nanoid } from "nanoid";
import { StateChangeHandler } from "./LinkedPrimitive";
import { MutationHashable } from "./MutationHashable";
import { Subbable } from "./Subbable";
import { SubbableContainer, UpdateToken } from "./SubbableContainer";

// todo: history
export class LinkedMap<K, V>
  implements Map<K, V>, Subbable, MutationHashable, SubbableContainer
{
  private _map: Map<K, V>;

  // SubbableContainer
  _id: string;
  public readonly _container = new Set<SubbableContainer>();
  public readonly _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  // MutationHashable
  _subscriptors = new Set<StateChangeHandler<Subbable>>();
  _hash: number = 0;

  _setRaw(map: ReadonlyMap<K, V>) {
    this._map = new Map(map);
    MutationHashable.mutated(this, this);
  }

  _getRaw(): ReadonlyMap<K, V> {
    return this._map;
  }

  private constructor(initialValue: Map<K, V>, id: string) {
    this._id = id;
    this._map = initialValue;
    SubbableContainer._containAll(this, this._map.keys());
    SubbableContainer._containAll(this, this._map.values());
  }

  public static create<K, V>(initialValue?: Map<K, V>) {
    return new this<K, V>(initialValue ?? new Map(), nanoid(5));
  }

  map<T>(callbackfn: (value: V, key: K, map: Map<K, V>) => T): T[] {
    const mapped: T[] = [];
    this._map.forEach((value, key) => {
      const res = callbackfn(value, key, this._map);
      mapped.push(res);
    });
    return mapped;
  }

  //////////// Map interface

  // Map<K, V> interface, mutates
  clear(): void {
    SubbableContainer._uncontain(this, this._map.keys());
    SubbableContainer._uncontain(this, this._map.values());
    this._map.clear();
    MutationHashable.mutated(this, this);
  }

  // Map<K, V> interface, mutates
  delete(key: K): boolean {
    if (!this._map.has(key)) {
      return false;
    }
    SubbableContainer._uncontain(this, key);
    SubbableContainer._uncontain(this, this._map.get(key));
    const result = this._map.delete(key);
    MutationHashable.mutated(this, this);
    return result;
  }

  // Map<K, V> interface
  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    this._map.forEach(callbackfn, thisArg);
  }

  // Map<K, V> interface
  get(key: K): V | undefined {
    return this._map.get(key);
  }

  // Map<K, V> interface
  has(key: K): boolean {
    return this._map.has(key);
  }

  // Map<K, V> interface, mutates
  set(key: K, value: V): this {
    SubbableContainer._contain(this, key);
    SubbableContainer._contain(this, value);

    this._map.set(key, value);
    MutationHashable.mutated(this, this);
    return this;
  }

  // Map<K, V> interface
  get size(): number {
    return this._map.size;
  }

  // Map<K, V> interface
  entries(): MapIterator<[K, V]> {
    return this._map.entries();
  }

  // Map<K, V> interface
  keys(): MapIterator<K> {
    return this._map.keys();
  }

  // Map<K, V> interface
  values(): MapIterator<V> {
    return this._map.values();
  }

  // Map<K, V> interface
  [Symbol.iterator](): MapIterator<[K, V]> {
    return this._map[Symbol.iterator]();
  }

  // Map<K, V> interface
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }
}
