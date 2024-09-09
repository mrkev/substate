import { StateChangeHandler } from "./LinkedPrimitive";
import { MutationHashable } from "./MutationHashable";
import { Subbable } from "./Subbable";

// TODO: SubbableContainer, Contained
export class LinkedMap<K, V> implements Map<K, V>, Subbable, MutationHashable {
  private _map = new Map<K, V>();

  _subscriptors = new Set<StateChangeHandler<Subbable>>();
  _hash: number = 0;

  _setRaw(map: ReadonlyMap<K, V>) {
    this._map = new Map(map);
    MutationHashable.mutated(this, this);
  }

  _getRaw(): ReadonlyMap<K, V> {
    return this._map;
  }

  private constructor(initialValue: Map<K, V>) {
    this._map = initialValue;
  }

  public static create<K, V>(initialValue?: Map<K, V>) {
    return new this<K, V>(initialValue ?? new Map());
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
    this._map.clear();
    MutationHashable.mutated(this, this);
  }

  // Map<K, V> interface, mutates
  delete(key: K): boolean {
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
    this._map.set(key, value);
    MutationHashable.mutated(this, this);
    return this;
  }

  // Map<K, V> interface
  get size(): number {
    return this._map.size;
  }

  // Map<K, V> interface
  entries(): IterableIterator<[K, V]> {
    return this._map.entries();
  }

  // Map<K, V> interface
  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  // Map<K, V> interface
  values(): IterableIterator<V> {
    return this._map.values();
  }

  // Map<K, V> interface
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._map[Symbol.iterator]();
  }

  // Map<K, V> interface
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }
}
