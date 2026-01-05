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
    const changes = {
      contained: [] as MarkedSubbable[],
      uncontained: [] as MarkedSubbable[],
    };
    const result = mutator(
      (items) =>
        (changes.contained = subbableContainer._containAll(struct, items)),
      (items) =>
        (changes.uncontained = subbableContainer._uncontainAll(struct, items))
    );

    // console.log("changes", changes);
    subbableContainer._notifyChange(struct, struct);
    return result;
  }
}

export interface MarkedSubbable {
  readonly $$mark: SubbableMark;
}
