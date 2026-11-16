import { nanoid } from "nanoid";
import { subbableContainer } from "./lib/SubbableContainer";
import { MarkedSubbable, SubbableMark } from "./lib/SubbableMark";
import { relativeIndex, toIntegerOrInfinity } from "./util/arrayIndex";

/**
 * A reactive Array. Mutate it through its methods (`push`, `splice`, `fill`,
 * ...): writing by index (`arr[i] = x`) or to `length` (`arr.length = 0`)
 * changes the array without notifying subscribers or linking / unlinking items.
 * Use `arr.splice(i, 1, x)` and `arr.splice(n)` instead. Reading by index is
 * fine.
 */
export class MarkedArray<S> extends Array<S> implements MarkedSubbable {
  public readonly $$mark: SubbableMark;

  private constructor(_array: Iterable<S>, _id: string) {
    // Call super() bare and add items ourselves. Spreading them, super(..._array),
    // breaks: new Array(5) means "length 5", not [5] (and new Array(1.5) throws),
    // large inputs exceed the engine's argument limit, and iterating _array a
    // second time to contain items would find a one-shot iterator empty.
    super();
    this.$$mark = new SubbableMark(_id);
    for (const item of _array) {
      // super.push, not this.push: don't notify during construction
      super.push(item);
      subbableContainer._contain(this, item);
    }
  }

  public static create<T>(
    initialValue?: (readonly T[] | null) | Iterable<T> | null | undefined,
  ) {
    return new this<T>(initialValue ?? [], nanoid(5));
  }

  // The inherited Array.from / .of / .fromAsync construct `new MarkedArray()`
  // with no input and write items straight into slots, which throws (and would
  // skip containment anyway). Let native Array build a plain array, then go
  // through create.

  static override from<T>(arrayLike: ArrayLike<T>): MarkedArray<T>;
  static override from<T, U>(
    arrayLike: ArrayLike<T>,
    mapfn: (v: T, k: number) => U,
    thisArg?: unknown,
  ): MarkedArray<U>;
  static override from<T>(iterable: Iterable<T> | ArrayLike<T>): MarkedArray<T>;
  static override from<T, U>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn: (v: T, k: number) => U,
    thisArg?: unknown,
  ): MarkedArray<U>;
  static override from<T, U>(
    items: Iterable<T> | ArrayLike<T>,
    mapfn?: (v: T, k: number) => U,
    thisArg?: unknown,
  ): MarkedArray<T | U> {
    return MarkedArray.create<T | U>(
      // check for undefined, not falsy: native throws on a non-callable mapfn
      mapfn === undefined
        ? Array.from(items)
        : Array.from(items, mapfn, thisArg),
    );
  }

  static override of<T>(...items: T[]): MarkedArray<T> {
    return MarkedArray.create(items);
  }

  // not `override`: Array.fromAsync is only typed in TypeScript's esnext lib
  static fromAsync<T>(
    items: AsyncIterable<T> | Iterable<T | PromiseLike<T>> | ArrayLike<T | PromiseLike<T>>,
  ): Promise<MarkedArray<Awaited<T>>>;
  static fromAsync<T, U>(
    items: AsyncIterable<T> | Iterable<T> | ArrayLike<T>,
    mapfn: (value: Awaited<T>, index: number) => U,
    thisArg?: unknown,
  ): Promise<MarkedArray<Awaited<U>>>;
  static async fromAsync(
    ...args: [items: unknown, mapfn?: unknown, thisArg?: unknown]
  ): Promise<MarkedArray<unknown>> {
    const nativeFromAsync = (
      Array as unknown as {
        fromAsync: (...args: unknown[]) => Promise<unknown[]>;
      }
    ).fromAsync;
    return MarkedArray.create(await nativeFromAsync.apply(Array, args));
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
    if (this.length < 1) {
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
      return this.length;
    }

    return this.$$mark.mutate(this, (contain) => {
      contain(items);
      return super.push(...items);
    });
  }

  // added by me, mutates
  pushAll(items: S[]): number {
    if (items.length < 1) {
      return this.length;
    }

    return this.$$mark.mutate(this, (contain) => {
      contain(items);
      for (const item of items) {
        super.push(item);
      }
      return this.length;
    });
  }

  // Array<S> interface, mutates
  override unshift(...items: S[]): number {
    if (items.length < 1) {
      return this.length;
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
  override splice(
    // rest args so we forward exactly what the caller passed: native splice
    // treats splice(1) (delete to end) differently from splice(1, undefined)
    // (delete nothing)
    ...args: [start?: number, deleteCount?: number, ...items: S[]]
  ): S[] {
    const len = this.length;
    const actualStart = relativeIndex(args[0], len);
    const deleteCount =
      args.length === 0
        ? 0
        : args.length === 1
          ? len - actualStart
          : Math.min(
              Math.max(toIntegerOrInfinity(args[1]), 0),
              len - actualStart,
            );
    const items = args.slice(2) as S[];

    // nothing removed or inserted: nothing changes, so don't notify subscribers
    if (deleteCount === 0 && items.length === 0) {
      return [];
    }

    return this.$$mark.mutate(this, (contain, uncontain) => {
      const deleted = super.splice(...(args as [number, number, ...S[]]));
      // uncontain before containing, so an item that is both removed and
      // re-inserted (eg, splice(i, 1, arr[i])) stays contained
      uncontain(deleted);
      contain(items);
      return deleted;
    });
  }

  // Array<S> interface, mutates
  override fill(value: S, start?: number, end?: number): this {
    const len = this.length;
    // normalize the range the same way Array.prototype.fill does
    const lo = relativeIndex(start, len);
    const hi = end === undefined ? len : relativeIndex(end, len);

    // empty range: nothing changes, so don't notify subscribers
    if (lo >= hi) {
      return this;
    }

    return this.$$mark.mutate(this, (contain, uncontain) => {
      const overwritten = super.slice(lo, hi);
      super.fill(value, lo, hi);
      // value now occupies hi - lo slots, and each overwritten slot is released
      contain(Array.from({ length: hi - lo }, () => value));
      uncontain(overwritten);
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
