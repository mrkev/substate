import { nanoid } from "nanoid";
import { subbableContainer } from "../lib/SubbableContainer";
import { MarkedSubbable, SubbableMark } from "../lib/SubbableMark";

export class MarkedArray<S> extends Array<S> implements MarkedSubbable {
  public readonly $$token: SubbableMark;

  private constructor(_array: Iterable<S>, _id: string) {
    // apparently, unlike with MarkedSet, I can just pass the values to the constructor here?
    super(..._array);
    subbableContainer._containAll(this, _array);
    this.$$token = new SubbableMark(this, _id, this);
  }

  public static create<T>(
    initialValue?: (readonly T[] | null) | Iterable<T> | null | undefined
  ) {
    return new this<T>(initialValue ?? [], nanoid(5));
  }

  // Array<S> interface, mutates
  override pop(): S | undefined {
    if (super.length < 1) {
      return;
    }

    return this.$$token.mutate(this, (_, uncontain) => {
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

    return this.$$token.mutate(this, (_, uncontain) => {
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

    return this.$$token.mutate(this, (contain) => {
      contain(items);
      return super.push(...items);
    });
  }

  // Array<S> interface, mutates
  override unshift(...items: S[]): number {
    if (items.length < 1) {
      return super.length;
    }

    return this.$$token.mutate(this, (contain) => {
      contain(items);
      return super.unshift(...items);
    });
  }

  // Array<S> interface, mutates
  override sort(compareFn?: (a: S, b: S) => number): this {
    return this.$$token.mutate(this, () => {
      super.sort(compareFn);
      return this;
    });
  }

  // Array<S> interface, mutates
  override reverse(): this {
    // TODO: if empty do nothing?
    return this.$$token.mutate(this, () => {
      super.reverse();
      return this;
    });
  }

  // Array<S> interface, mutates
  override splice(start: number, deleteCount?: number): S[];
  override splice(start: number, deleteCount: number, ...items: S[]): S[];
  override splice(start: any, deleteCount?: any, ...items: any[]): S[] {
    return this.$$token.mutate(this, (contain, uncontain) => {
      // TODO: test correct contain/uncontain
      contain(items);
      const deleted = super.splice(start, deleteCount, ...items);
      uncontain(deleted);
      return deleted;
    });
  }

  // Array<S> interface, mutates
  override fill(value: S, start?: number, end?: number): this {
    console.warn("TODO: TEST CONTAINMENT MarkedArray.fill");
    return this.$$token.mutate(this, (contain) => {
      contain([value]);
      super.fill(value, start, end);
      return this;
    });
  }

  // Array<S> interface, mutates
  override copyWithin(target: number, start: number, end?: number): this {
    return this.$$token.mutate(this, () => {
      console.warn("TODO: copyWithin BREAKING: containment");
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
