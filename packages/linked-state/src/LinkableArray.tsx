import { nanoid } from "nanoid";
import { Contained } from "../lib/Contained";
import { Subbable, SubbableCallback } from "../lib/Subbable";
import { subbableContainer, SubbableContainer } from "../lib/SubbableContainer";
import { mutablearr } from "./nullthrows";

// .sort, .reverse, .fill, .copyWithin operate in place and return the array. SubbableArray
// is not quite an array so the return types don't match.
// .map has the third argument of its callback function be a readonly array, instead of just an array
// .reduce, .reduceRight I just don't feel like implementing
export type ArrayWithoutIndexer<T> = Omit<
  Array<T>,
  | number
  | "sort"
  | "reverse"
  | "fill"
  | "copyWithin"
  | "reduce"
  | "reduceRight"
  | "map"
  | "toReversed"
  | "toSorted"
  | "toSpliced"
  | "with"
>;

// NOTE: don't use LinkedArray directly, use SArray
export class LinkableArray<S>
  implements ArrayWithoutIndexer<S>, Subbable, SubbableContainer, Contained
{
  // main
  protected _array: Array<S>;

  // Subbable
  readonly _id: string;
  public readonly _subscriptors: Set<SubbableCallback> = new Set();

  // MutationHashable
  public _hash: number = 0;

  // SubbableContainer
  readonly _propagatedTokens = new WeakSet();

  // Contained
  readonly _container = new Set<SubbableContainer>();

  _replace(cb: (arr: Array<S>) => ReadonlyArray<S>) {
    subbableContainer._uncontainAll(this, this._array);
    this._array = mutablearr(cb(this._array));
    subbableContainer._containAll(this, this._array);
    subbableContainer._notifyChange(this, this);
  }

  private constructor(initialValue: Array<S>, id: string, anonymous = false) {
    this._id = id;
    this._array = initialValue;
    subbableContainer._containAll(this, this._array);
    if (!anonymous) {
      // getGlobalState().knownObjects.set(this._id, this);
    }
  }

  public static create<T>(initialValue?: Array<T>) {
    return new this(initialValue ?? [], nanoid(5));
  }

  private mutate<V>(mutator: () => V): V {
    // saveForHistory(this);
    const result = mutator();
    subbableContainer._notifyChange(this, this);
    return result;
  }

  _getRaw(): Array<S> {
    return this._array;
  }

  // me
  toJSON() {
    return this._array;
  }

  // Array<S> interface
  get length(): number {
    return this._array.length;
  }

  at(index: number): S | undefined {
    return this._array.at(index);
  }

  [Symbol.iterator](): ArrayIterator<S> {
    return this._array[Symbol.iterator]();
  }

  // Array<S> interface
  toString(): string {
    return `${this.constructor.name}[${this._array.toString()}]`;
  }

  // Array<S> interface
  toLocaleString(): string {
    throw this._array.toLocaleString();
  }

  // Array<S> interface, mutates
  pop(): S | undefined {
    if (this.length < 1) {
      return;
    }

    return this.mutate(() => {
      const res = this._array.pop();
      res != null && subbableContainer._uncontain(this, res);
      return res;
    });
  }

  // Array<S> interface, mutates
  shift(): S | undefined {
    if (this.length < 1) {
      return;
    }

    return this.mutate(() => {
      const res = this._array.shift();
      res != null && subbableContainer._uncontain(this, res);
      return res;
    });
  }

  // Array<S> interface, mutates
  push(...items: S[]): number {
    if (items.length < 1) {
      return this.length;
    }

    return this.mutate(() => {
      subbableContainer._containAll(this, items);
      return this._array.push(...items);
    });
  }

  // Array<S> interface, mutates
  unshift(...items: S[]): number {
    if (items.length < 1) {
      return this.length;
    }
    subbableContainer._containAll(this, items);

    return this.mutate(() => {
      return this._array.unshift(...items);
    });
  }

  // Array<S> interface, mutates
  sort(compareFn?: (a: S, b: S) => number): this {
    return this.mutate(() => {
      this._array.sort(compareFn);
      return this;
    });
  }

  // Array<S> interface, mutates
  reverse(): this {
    // TODO: if empty do nothing?
    return this.mutate(() => {
      this._array.reverse();
      return this;
    });
  }

  // Array<S> interface, mutates
  splice(start: number, deleteCount?: number): S[];
  splice(start: number, deleteCount: number, ...items: S[]): S[];
  splice(start: any, deleteCount?: any, ...items: any[]): S[] {
    subbableContainer._containAll(this, items);
    return this.mutate(() => {
      const deleted = this._array.splice(start, deleteCount, ...items);
      for (const elem of deleted) {
        subbableContainer._uncontain(this, elem);
      }
      return deleted;
    });
  }

  // Array<S> interface, mutates
  fill(value: S, start?: number, end?: number): this {
    subbableContainer._containAll(this, [value]);
    console.warn("TODO: fill BREAKING: containment");
    return this.mutate(() => {
      this._array.fill(value, start, end);
      return this;
    });
  }

  // Array<S> interface, mutates
  copyWithin(target: number, start: number, end?: number): this {
    return this.mutate(() => {
      console.warn("TODO: copyWithin BREAKING: containment");
      this._array.copyWithin(target, start, end);
      return this;
    });
  }

  // Array<S> interface
  map<U>(
    callbackfn: (value: S, index: number, array: readonly S[]) => U,
    thisArg?: any
  ): U[] {
    return this._array.map(callbackfn, thisArg);
  }

  // Array<S> interface
  indexOf(searchElement: S, fromIndex?: number): number {
    return this._array.indexOf(searchElement, fromIndex);
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

  [Symbol.unscopables] = [][Symbol.unscopables as any] as any;

  /////////////////////

  // does not mutate
  slice(start?: number, end?: number): S[] {
    throw new Error("Method not implemented.");
  }

  concat(...items: ConcatArray<S>[]): S[];
  concat(...items: (S | ConcatArray<S>)[]): S[];
  concat(...items: any[]): S[] {
    throw new Error("Method not implemented.");
  }

  join(separator?: string): string {
    throw new Error("Method not implemented.");
  }

  lastIndexOf(searchElement: S, fromIndex?: number): number {
    return this._array.lastIndexOf(searchElement, fromIndex);
  }

  every<S>(
    predicate: (value: S, index: number, array: S[]) => value is S,
    thisArg?: any
  ): this is S[];
  every(
    predicate: (value: S, index: number, array: S[]) => unknown,
    thisArg?: any
  ): boolean;
  every(predicate: any, thisArg?: any): boolean {
    throw new Error("Method not implemented.");
  }

  some(
    predicate: (value: S, index: number, array: S[]) => unknown,
    thisArg?: any
  ): boolean {
    return this._array.some(predicate, thisArg);
  }

  forEach(
    callbackfn: (value: S, index: number, array: S[]) => void,
    thisArg?: any
  ): void {
    return this._array.forEach(callbackfn, thisArg);
  }

  filter<S>(
    predicate: (value: S, index: number, array: S[]) => value is S,
    thisArg?: any
  ): S[];
  filter(
    predicate: (value: S, index: number, array: S[]) => unknown,
    thisArg?: any
  ): S[];
  filter(predicate: any, thisArg?: any): S[] | S[] {
    throw new Error("Method not implemented.");
  }

  find<S>(
    predicate: (this: void, value: S, index: number, obj: S[]) => value is S,
    thisArg?: any
  ): S | undefined;
  find(
    predicate: (value: S, index: number, obj: S[]) => unknown,
    thisArg?: any
  ): S | undefined;
  find(predicate: any, thisArg?: any): S | S | undefined {
    return this._array.find(predicate, thisArg);
  }
  findIndex(
    predicate: (value: S, index: number, obj: S[]) => unknown,
    thisArg?: any
  ): number {
    return this._array.findIndex(predicate, thisArg);
  }

  findLast<S>(
    predicate: (value: S, index: number, array: S[]) => value is S,
    thisArg?: any
  ): S | undefined;
  findLast(
    predicate: (value: S, index: number, array: S[]) => unknown,
    thisArg?: any
  ): S | undefined;
  findLast(predicate: unknown, thisArg?: unknown): S | S | undefined {
    throw new Error("Method not implemented.");
  }

  findLastIndex(
    predicate: (value: S, index: number, array: S[]) => unknown,
    thisArg?: any
  ): number {
    throw new Error("Method not implemented.");
  }

  entries(): ArrayIterator<[number, S]> {
    return this._array.entries();
  }
  keys(): ArrayIterator<number> {
    return this._array.keys();
  }
  values(): ArrayIterator<S> {
    return this._array.values();
  }
  includes(searchElement: S, fromIndex?: number): boolean {
    throw new Error("Method not implemented.");
  }
  flatMap<U, This = undefined>(
    callback: (
      this: This,
      value: S,
      index: number,
      array: S[]
    ) => U | readonly U[],
    thisArg?: This
  ): U[] {
    throw new Error("Method not implemented.");
  }
  flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[] {
    throw new Error("Method not implemented.");
  }
}
