import { nanoid } from "nanoid";
import { useCallback, useSyncExternalStore } from "react";
import { Contained } from "../lib/Contained";
import { MutationHashable } from "../lib/MutationHashable";
import { StateChangeHandler, Subbable, subscribe } from "../lib/Subbable";
import {
  IterableCollection,
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "../lib/SubbableContainer";

class SubbableMark
  implements Subbable, SubbableContainer, MutationHashable, Contained
{
  // Subbable
  public readonly _id: string;
  public readonly _subscriptors = new Set<StateChangeHandler<Subbable>>();

  // SubbableContainer
  public readonly _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  // MutationHashable
  public _hash: number = 0;

  // Contained
  public readonly _container = new Set<SubbableContainer>();

  constructor(_id: string, contain: IterableCollection) {
    this._id = _id;
    subbableContainer._containAll(this, contain);
    // getGlobalState().knownObjects.set(this._id, this);
  }

  public static create<T>(
    initial?: (readonly T[] | null) | Iterable<T> | null | undefined
  ) {
    return new this(nanoid(5), new Set(initial));
  }

  public mutate<V>(
    mutator: (
      contain: (items: IterableCollection) => void,
      uncontain: (items: IterableCollection) => void
    ) => V
  ): V {
    // saveForHistory(this);
    const result = mutator(
      (items) => subbableContainer._containAll(this, items),
      (items) => subbableContainer._uncontainAll(this, items)
    );
    subbableContainer._notifyChange(this, this);
    return result;
  }
}

interface MarkedSubbable {
  $$token: SubbableMark;
}

export class MarkedSet<S> extends Set<S> implements MarkedSubbable {
  public readonly $$token: SubbableMark;

  private constructor(_set: Set<S>, _id: string) {
    super(_set);
    this.$$token = new SubbableMark(_id, this);
    subbableContainer._containAll(this.$$token, this);
  }

  public static create<T>(
    initial?: (readonly T[] | null) | Iterable<T> | null | undefined
  ) {
    return new this<T>(new Set(initial), nanoid(5));
  }

  _setRaw(set: Set<S>) {
    this.$$token.mutate((contain, uncontain) => {
      uncontain(this);
      for (const elem of this) {
        this.delete(elem);
      }
      contain(set);
      for (const elem of set) {
        this.add(elem);
      }
    });
  }

  // Set<S> interface, mutates
  override add(value: S): this {
    if (this.has(value)) {
      return this;
    }
    return this.$$token.mutate((contain) => {
      contain([value]);
      this.add(value);
      return this;
    });
  }

  // Set<S> interface, mutates
  override delete(value: S): boolean {
    if (!this.has(value)) {
      return false;
    }

    return this.$$token.mutate((_, uncontain) => {
      // NOTE: We have confirmed above the set has this value, so it will be removed
      uncontain([value]);
      return this.delete(value);
    });
  }

  // Set<S> interface, mutates
  override clear(): void {
    this.$$token.mutate((_, uncontain) => {
      uncontain(this);
      for (const elem of this) {
        this.delete(elem);
      }
    });
  }

  // non-standard
  public map<U>(callbackfn: (value: S) => U): U[] {
    const result = [];
    for (const value of this.values()) {
      result.push(callbackfn(value));
    }
    return result;
  }
}

export function useLinkMarked<S extends MarkedSubbable>(
  obj: S,
  recursiveChanges: boolean = false
): () => S {
  "use no memo"; // dont memo this hook
  const _hash = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        return subscribe(obj.$$token, (target) => {
          // console.log(
          //   "got notif",
          //   obj,
          //   "target is",
          //   target,
          //   "notifying?",
          //   obj === target || recursiveChanges
          // );
          if (obj.$$token === target || recursiveChanges) {
            onStoreChange();
          }
        });
      },
      [obj, recursiveChanges]
    ),
    useCallback(() => obj.$$token._hash, [obj])
  );
  return () => obj;
}

// type Constructor<T = any> = new (...args: any[]) => T;

// // Identity function for any class
// function marked<C extends Constructor>(Cls: C): C {
//   const klass = class extends Cls {
//     public readonly $$token: SubbableMark;

//     private constructor(_set: Set<S>, _id: string) {
//       super(_set);
//       this.$$token = new SubbableMark(_id, this);
//       subbableContainer._containAll(this.$$token, this);
//     }
//   };

//   Object.defineProperty(klass, "name", { value: `Marked${Cls.name}` });
//   return klass;
// }

// class Foo<T> extends marked(Set)<T> {}
