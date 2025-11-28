import { nanoid } from "nanoid";
import { subbableContainer } from "../lib/SubbableContainer";
import { MarkedSubbable, SubbableMark } from "../lib/SubbableMark";

export class MarkedArray<S> extends Array<S> implements MarkedSubbable {
  public readonly $$mark: SubbableMark;

  private constructor(_array: Iterable<S>, _id: string) {
    // apparently, unlike with MarkedSet, I can just pass the values to the constructor here?
    console.log("here");
    super(..._array);
    this.$$mark = new SubbableMark(_id);
    subbableContainer._containAll(this, _array);
  }

  public static create<T>(
    initialValue?: (readonly T[] | null) | Iterable<T> | null | undefined
  ) {
    return new this<T>(initialValue ?? [], nanoid(5));
  }

  // Array<S> interface, mutates
  override pop(): S | undefined {
    if (this.length < 1) {
      return;
    }

    return this.$$mark.mutate(this, (_, uncontain) => {
      const res = super.pop();
      res != null && uncontain([res]);
      return res;
    });
  }

  // Array<S> interface, mutates
  override shift(): S | undefined {
    if (super.length < 1) {
      return;
    }

    return this.$$mark.mutate(this, (_, uncontain) => {
      const res = super.shift();
      res != null && uncontain([res]);
      return res;
    });
  }

  // Array<S> interface, mutates
  override push(...items: S[]): number {
    if (items.length < 1) {
      return super.length;
    }

    return this.$$mark.mutate(this, (contain) => {
      contain(items);
      return super.push(...items);
    });
  }

  // Array<S> interface, mutates
  override unshift(...items: S[]): number {
    if (items.length < 1) {
      return super.length;
    }

    return this.$$mark.mutate(this, (contain) => {
      contain(items);
      return super.unshift(...items);
    });
  }

  // Array<S> interface, mutates
  override sort(compareFn?: (a: S, b: S) => number): this {
    if (this.length === 0) return this;
    return this.$$mark.mutate(this, () => {
      super.sort(compareFn);
      return this;
    });
  }

  // Array<S> interface, mutates
  override reverse(): this {
    if (this.length === 0) return this;
    return this.$$mark.mutate(this, () => {
      super.reverse();
      return this;
    });
  }

  static override get [Symbol.species]() {
    return Array; // Force splice to return a standard Array
  }

  // Array<S> interface, mutates
  override splice(start: number, deleteCount?: number): S[];
  override splice(start: number, deleteCount: number, ...items: S[]): S[];
  override splice(start: any, deleteCount?: any, ...items: any[]): S[] {
    return this.$$mark.mutate(this, (contain, uncontain) => {
      // TODO: test correct contain/uncontain
      contain(items);
      const deleted = super.splice(start, deleteCount, ...items);
      uncontain(deleted);
      return deleted;
    });
  }

  // Array<S> interface, mutates
  override fill(value: S, start?: number, end?: number): this {
    throw new Error("unimplemented");
    return this.$$mark.mutate(this, (contain) => {
      contain([value]);
      // TODO: uncontain overwritten elements
      super.fill(value, start, end);
      return this;
    });
  }

  // Array<S> interface, mutates
  override copyWithin(target: number, start: number, end?: number): this {
    throw new Error("unimplemented");
    return this.$$mark.mutate(this, () => {
      // TODO: uncontain overwritten elements
      super.copyWithin(target, start, end);
      return this;
    });
  }

  // not in standard arrays
  public remove(searchElement: S): S | null {
    const index = this.indexOf(searchElement);
    if (index === -1) {
      return null;
    }

    // containment handled by splice
    return this.splice(index, 1)[0];
  }
}
