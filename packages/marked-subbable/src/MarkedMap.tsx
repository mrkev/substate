import { nanoid } from "nanoid";
import { MarkedSubbable, SubbableMark } from "./lib/SubbableMark";
import { keysAndValues } from "./util/keysAndValues";

export class MarkedMap<K, V> extends Map<K, V> implements MarkedSubbable {
  readonly $$mark: SubbableMark;

  private constructor(initialValue: Map<K, V>, id: string) {
    super();
    this.$$mark = new SubbableMark(id);
    for (const [key, value] of initialValue) {
      this.set(key, value);
    }
  }

  public static create<K, V>(
    initial?:
      | (readonly (readonly [K, V])[] | null)
      | (Iterable<readonly [K, V]> | null),
  ) {
    return new this<K, V>(new Map(initial), nanoid(5));
  }

  //////////// Map interface

  // Map<K, V> interface, mutates
  override clear(): void {
    if (this.size === 0) {
      return;
    }

    this.$$mark.mutate(this, (_, uncontain) => {
      uncontain(keysAndValues(this));
      super.clear();
    });
  }

  // Map<K, V> interface, mutates
  override delete(key: K): boolean {
    if (!this.has(key)) {
      return false;
    }

    return this.$$mark.mutate(this, (_, uncontain) => {
      uncontain([key, this.get(key)]);
      return super.delete(key);
    });
  }

  // Map<K, V> interface, mutates
  override set(key: K, value: V): this {
    return this.$$mark.mutate(this, (contain, uncontain) => {
      if (this.has(key)) {
        // the key stays, only its value is replaced
        uncontain([this.get(key)]);
      } else {
        contain([key]);
      }
      contain([value]);
      return super.set(key, value);
    });
  }

  // non-standard

  public replace(map: Map<K, V>) {
    if (this.size === 0 && map.size === 0) {
      return;
    }

    this.$$mark.mutate(this, (contain, uncontain) => {
      uncontain(keysAndValues(this));
      super.clear();
      contain(keysAndValues(map));
      for (const [key, value] of map) {
        super.set(key, value);
      }
    });
  }

  public map<T>(callbackfn: (value: V, key: K, map: Map<K, V>) => T): T[] {
    const mapped: T[] = [];
    this.forEach((value, key) => {
      const res = callbackfn(value, key, this);
      mapped.push(res);
    });
    return mapped;
  }
}
