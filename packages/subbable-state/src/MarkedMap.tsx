import { nanoid } from "nanoid";
import { MarkedSubbable, SubbableMark } from "../lib/SubbableMark";
import { nullthrows } from "./nullthrows";

export class MarkedMap<K, V> extends Map<K, V> implements MarkedSubbable {
  readonly $$mark: SubbableMark;

  private constructor(initialValue: Map<K, V>, id: string) {
    super();
    this.$$mark = new SubbableMark(this, id, this);
    this.replace(initialValue);
  }

  public static create<K, V>(
    initial?:
      | (readonly (readonly [K, V])[] | null)
      | (Iterable<readonly [K, V]> | null)
  ) {
    return new this<K, V>(new Map(initial), nanoid(5));
  }

  //////////// Map interface

  // Map<K, V> interface, mutates
  override clear(): void {
    return this.$$mark.mutate(this, (_, uncontain) => {
      uncontain(this);
      return super.clear();
    });
  }

  // Map<K, V> interface, mutates
  override delete(key: K): boolean {
    if (!this.has(key)) {
      return false;
    }

    return this.$$mark.mutate(this, (_, uncontain) => {
      // NOTE: We have confirmed above the set has this value
      const value = nullthrows(this.get(key), "this should never happen");
      uncontain([value]);
      return super.delete(key);
    });
  }

  // Map<K, V> interface, mutates
  override set(key: K, value: V): this {
    return this.$$mark.mutate(this, (contain, uncontain) => {
      // NOTE: We have confirmed above the set has this value
      const old = this.get(key);
      if (old != null) {
        uncontain([old]);
      }
      contain([value]);
      return super.set(key, value);
    });
  }

  // non-standard

  public replace(map: Map<K, V>) {
    this.$$mark.mutate(this, (contain, uncontain) => {
      uncontain(this);
      for (const [key] of this) {
        super.delete(key);
      }
      contain(map);
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
