import { nanoid } from "nanoid";
import { subbableContainer } from "./lib/SubbableContainer";
import { MarkedSubbable, SubbableMark } from "./lib/SubbableMark";

// A Subbable set that works via a $$mark (vs implementing
// everything that makes a subbable itself)
export class MarkedSet<S> extends Set<S> implements MarkedSubbable {
  public readonly $$mark: SubbableMark;

  private constructor(_set: Set<S>, _id: string) {
    // calling super(_set) would call our overridden .add on each element
    // before $$mark is set, so add elements ourselves afterwards.
    // super.add, not this.add: don't notify during construction
    super();
    this.$$mark = new SubbableMark(_id);
    for (const elem of _set) {
      super.add(elem);
      subbableContainer._contain(this, elem);
    }
  }

  public static create<T>(
    initial?: (readonly T[] | null) | Iterable<T> | null | undefined,
  ) {
    return new this<T>(new Set(initial), nanoid(5));
  }

  // Set<S> interface, mutates
  override add(value: S): this {
    if (this.has(value)) {
      return this;
    }
    return this.$$mark.mutate(this, (contain) => {
      contain([value]);
      super.add(value);
      return this;
    });
  }

  // Set<S> interface, mutates
  override delete(value: S): boolean {
    if (!this.has(value)) {
      return false;
    }

    return this.$$mark.mutate(this, (_, uncontain) => {
      // NOTE: We have confirmed above the set has this value, so it will be removed
      uncontain([value]);
      return super.delete(value);
    });
  }

  // Set<S> interface, mutates
  override clear(): void {
    if (this.size === 0) {
      return;
    }

    this.$$mark.mutate(this, (_, uncontain) => {
      uncontain(this);
      for (const elem of this) {
        super.delete(elem);
      }
    });
  }

  // non-standard //

  public replace(set: Set<S>) {
    // replacing with itself changes nothing (and clearing first would empty
    // `set` too); nothing to replace when both are empty
    if (set === this || (this.size === 0 && set.size === 0)) {
      return;
    }

    this.$$mark.mutate(this, (contain, uncontain) => {
      uncontain(this);
      for (const elem of this) {
        super.delete(elem);
      }
      contain(set);
      for (const elem of set) {
        super.add(elem);
      }
    });
  }

  public map<U>(callbackfn: (value: S) => U): U[] {
    const result = [];
    for (const value of this.values()) {
      result.push(callbackfn(value));
    }
    return result;
  }
}
