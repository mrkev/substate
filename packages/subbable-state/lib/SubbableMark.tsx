import { nanoid } from "nanoid";
import { Contained } from "./Contained";
import { Subbable, SubbableCallback } from "./Subbable";
import {
  IterableCollection,
  subbableContainer,
  SubbableContainer,
  UpdateToken,
} from "./SubbableContainer";

export class SubbableMark implements Subbable, SubbableContainer, Contained {
  // Subbable
  public readonly _id: string;
  public readonly _subscriptors = new Set<SubbableCallback>();

  // SubbableContainer
  public readonly _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  // MutationHashable
  public _hash: number = 0;

  // Contained
  public readonly _container = new Set<MarkedSubbable>();

  constructor(_id: string) {
    this._id = _id;
    // getGlobalState().knownObjects.set(this._id, this);
  }

  public static create() {
    return new SubbableMark(nanoid(5));
  }

  public register<T>(
    holder: MarkedSubbable,
    contain?: (readonly T[] | null) | Iterable<T> | null | undefined
  ) {
    subbableContainer._containAll(holder, new Set(contain));
  }

  public mutate<V>(
    struct: MarkedSubbable,
    mutator: (
      contain: (items: IterableCollection) => void,
      uncontain: (items: IterableCollection) => void
    ) => V
  ): V {
    // saveForHistory(this);
    const result = mutator(
      (items) => subbableContainer._containAll(struct, items),
      (items) => subbableContainer._uncontainAll(struct, items)
    );
    subbableContainer._notifyChange(struct, struct);
    return result;
  }
}

export interface MarkedSubbable {
  readonly $$mark: SubbableMark;
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
