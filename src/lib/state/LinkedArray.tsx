import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { isContainable } from "../../assertions";
import { saveForHistory } from "../../sstate.history";
import { useSubscribeToSubbableMutationHashable } from "./LinkedMap";
import { StateChangeHandler, StateDispath } from "./LinkedPrimitive";
import { MutationHashable, SubbableContainer } from "./MutationHashable";
import { Subbable, notify, subscribe } from "./Subbable";

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

export class LinkedArray<S>
  implements ArrayWithoutIndexer<S>, Subbable, SubbableContainer
{
  readonly _id: string;
  private _array: Array<S>;
  readonly _subscriptors: Set<StateChangeHandler<Subbable>> = new Set();
  _hash: number = 0;
  _container: SubbableContainer | null = null;

  constructor(initialValue: Array<S>, id: string) {
    this._array = initialValue;
    this._id = id;
    this.contain(this._array);
  }

  _childChanged(child: Subbable) {
    MutationHashable.mutated(this, child);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  private mutate<V>(mutator: (clone: Array<S>) => V): V {
    saveForHistory(this as any);
    const result = mutator(this._array);
    MutationHashable.mutated(this, this);

    if (this._container != null) {
      this._container._childChanged(this);
    }
    return result;
  }

  private contain(items: Array<S>) {
    for (const elem of items) {
      if (isContainable(elem)) {
        elem._container = this;
        // console.log("CONTAINER OF", elem, "<=", this);
      }
    }
  }

  _getRaw(): Array<S> {
    return this._array;
  }

  _setRaw(array: Array<S>) {
    this._array = array;
    notify(this, this);
  }

  // me
  toJSON() {
    return this._array;
  }

  public static create<T>(initialValue?: Array<T>) {
    return new this(initialValue ?? [], nanoid(5));
  }

  // Array<S> interface
  get length(): number {
    return this._array.length;
  }

  // GETTER. Things with getters get tricky.
  // THis makes this a cointainer, and makes us wonder if this should be
  // a LinkedState too insteaed.
  at(index: number): S | undefined {
    return this._array.at(index);
  }

  [Symbol.iterator](): IterableIterator<S> {
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

    return this.mutate((clone) => {
      return clone.pop();
    });
  }

  // Array<S> interface, mutates
  shift(): S | undefined {
    if (this.length < 1) {
      return;
    }

    return this.mutate((clone) => {
      return clone.shift();
    });
  }

  _replace(arr: Array<S>) {
    this._array = arr; // todo, call ._destroy on child elements?
    this.contain(this._array);

    MutationHashable.mutated(this, this);
    if (this._container != null) {
      this._container._childChanged(this);
    }
  }

  // Array<S> interface, mutates
  push(...items: S[]): number {
    if (items.length < 1) {
      return this.length;
    }
    this.contain(items);

    return this.mutate((clone) => {
      return clone.push(...items);
    });
  }

  // Array<S> interface, mutates
  unshift(...items: S[]): number {
    if (items.length < 1) {
      return this.length;
    }
    this.contain(items);

    return this.mutate((clone) => {
      return clone.unshift(...items);
    });
  }

  // Array<S> interface, mutates
  sort(compareFn?: (a: S, b: S) => number): this {
    return this.mutate((clone) => {
      clone.sort(compareFn);
      return this;
    });
  }

  // Array<S> interface, mutates
  reverse(): this {
    return this.mutate((clone) => {
      clone.reverse();
      return this;
    });
  }

  // Array<S> interface, mutates
  splice(start: number, deleteCount?: number): S[];
  splice(start: number, deleteCount: number, ...items: S[]): S[];
  splice(start: any, deleteCount?: any, ...items: any[]): S[] {
    this.contain(items);
    return this.mutate((_array) => {
      const deleted = _array.splice(start, deleteCount, ...items);
      for (const elem of deleted) {
        // TODO: safety
        if ("_destroy" in (elem as any)) {
          (elem as any)._destroy();
        }
      }
      return deleted;
    });
  }

  // Array<S> interface, mutates
  fill(value: S, start?: number, end?: number): this {
    this.contain([value]);
    return this.mutate((_array) => {
      _array.fill(value, start, end);
      return this;
    });
  }

  // Array<S> interface, mutates
  copyWithin(target: number, start: number, end?: number): this {
    return this.mutate((_array) => {
      _array.copyWithin(target, start, end);
      return this;
    });
  }

  // TODO: should this mutate and return itself? return a new LinkedArray? just return an array? probably the latter right?
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
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }
  forEach(
    callbackfn: (value: S, index: number, array: S[]) => void,
    thisArg?: any
  ): void {
    throw new Error("Method not implemented.");
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
    return this._array.findIndex(predicate as any, thisArg);
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

  entries(): IterableIterator<[number, S]> {
    return this._array.entries();
  }
  keys(): IterableIterator<number> {
    return this._array.keys();
  }
  values(): IterableIterator<S> {
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

export function useLinkedArray<S>(
  linkedArray: LinkedArray<S>
): [LinkedArray<S>, StateDispath<Array<S>>] {
  useSubscribeToSubbableMutationHashable(linkedArray);

  const setter: StateDispath<Array<S>> = useCallback(
    function (newVal) {
      if (newVal instanceof Function) {
        linkedArray._setRaw(newVal(linkedArray._getRaw() as any));
      } else {
        linkedArray._setRaw(newVal);
      }
    },
    [linkedArray]
  );

  return [linkedArray, setter];
}

export function useObserveLinkedArray<S>(
  linkedArray: LinkedArray<S>
): LinkedArray<S> {
  const [_, setState] = useState(() => linkedArray._getRaw());

  useEffect(() => {
    return subscribe(linkedArray, (target) => {
      if (target === linkedArray) {
        setState(() => linkedArray._getRaw());
      }
    });
  }, [linkedArray]);

  return linkedArray;
}

export function useLinkedArrayMaybe<S>(
  linkedArray: LinkedArray<S> | null
): readonly S[] | null {
  const [state, setState] = useState(() => linkedArray?._getRaw() ?? null);

  useEffect(() => {
    if (linkedArray == null) {
      return;
    }
    setState(linkedArray._getRaw());
    return subscribe(linkedArray, (target) => {
      if (target === linkedArray) {
        setState(() => linkedArray._getRaw());
      }
    });
  }, [linkedArray]);

  return state;
}
