import { nanoid } from "nanoid";
import { mutationHashable, MutationHashable } from "../state/MutationHashable";
import { Subbable, SubbableCallback } from "../state/Subbable";
import {
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "../state/SubbableContainer";

// todo: history
export class LinkedMap<K, V>
  implements Map<K, V>, Subbable, MutationHashable, SubbableContainer
{
  // main
  private _map: Map<K, V>;

  // SubbableContainer
  _id: string;
  public readonly _container = new Set<SubbableContainer>();
  public readonly _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  // MutationHashable
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  _hash: number = 0;

  _setRaw(map: ReadonlyMap<K, V>) {
    this._map = new Map(map);
    mutationHashable.mutated(this, this);
  }

  _getRaw(): ReadonlyMap<K, V> {
    return this._map;
  }

  private constructor(initialValue: Map<K, V>, id: string) {
    this._id = id;
    this._map = initialValue;
    subbableContainer._containAll(this, this._map.keys());
    subbableContainer._containAll(this, this._map.values());
  }

  public static create<K, V>(
    initial?:
      | (readonly (readonly [K, V])[] | null)
      | (Iterable<readonly [K, V]> | null),
  ) {
    return new this<K, V>(new Map(initial), nanoid(5));
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
    subbableContainer._uncontain(this, this._map.keys());
    subbableContainer._uncontain(this, this._map.values());
    this._map.clear();
    mutationHashable.mutated(this, this);
  }

  // Map<K, V> interface, mutates
  delete(key: K): boolean {
    if (!this._map.has(key)) {
      return false;
    }
    subbableContainer._uncontain(this, key);
    subbableContainer._uncontain(this, this._map.get(key));
    const result = this._map.delete(key);
    mutationHashable.mutated(this, this);
    return result;
  }

  // Map<K, V> interface
  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any,
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
    subbableContainer._contain(this, key);
    subbableContainer._contain(this, value);

    this._map.set(key, value);
    mutationHashable.mutated(this, this);
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
