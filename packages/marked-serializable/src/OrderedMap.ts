import { nullthrows } from "./nullthrows";

export class OrderedMap<K, V> implements Map<K, V> {
  private readonly _order: Array<K>;

  static fromEntries<K, V>(
    entries: Iterable<readonly [K, V]> | null
  ): OrderedMap<K, V> {
    return new OrderedMap(new Map(entries));
  }

  constructor(private readonly _map: Map<K, V> = new Map<K, V>()) {
    this._order = Array.from(_map.keys());
  }
  clear(): void {
    this._map.clear();
    this._order.splice(0, this._order.length);
  }
  delete(key: K): boolean {
    const value = this._map.get(key);
    if (value == null) {
      return false;
    }
    const orderPos = this._order.indexOf(key);
    if (orderPos < 0) {
      throw new Error("deleting key without order");
    }

    this._map.delete(key);
    this._order.splice(orderPos, 1);
    return true;
  }
  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    throw new Error("Method not implemented.");
  }
  get(key: K): V | undefined {
    return this._map.get(key);
  }
  has(key: K): boolean {
    return this._map.has(key);
  }

  set(key: K, value: V): this {
    throw new Error("Method not implemented.");
  }
  get size(): number {
    return this._map.size;
  }
  entries(): MapIterator<[K, V]> {
    const self = this;
    return (function* () {
      for (const key of self._order) {
        yield [key, nullthrows(self._map.get(key))];
      }
      return undefined;
    })();
  }
  keys(): MapIterator<K> {
    return this._order[Symbol.iterator]();
  }
  values(): MapIterator<V> {
    const self = this;
    return (function* () {
      for (const key of self._order) {
        yield nullthrows(self._map.get(key));
      }
      return undefined;
    })();
  }
  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
  [Symbol.toStringTag]: string = "[OrderedMap]";

  // Array
  get length(): number {
    return this.size;
  }
  sort(compareFn?: ((a: [K, V], b: [K, V]) => number) | undefined): this {
    if (compareFn == null) {
      this._order.sort();
    } else {
      this._order.sort((a, b) => {
        const aval = nullthrows(this._map.get(a));
        const bval = nullthrows(this._map.get(b));
        return compareFn([a, aval], [b, bval]);
      });
    }
    return this;
  }
  push(key: K, value: V): this {
    this.delete(key);
    this._map.set(key, value);
    this._order.push(key);
    return this;
  }
}
