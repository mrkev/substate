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
  public readonly _container = new Map<MarkedSubbable, number>();

  constructor(_id: string) {
    this._id = _id;
    // getGlobalState().knownObjects.set(this._id, this);
  }

  public static create() {
    return new SubbableMark(nanoid(5));
  }

  public register<T>(
    holder: MarkedSubbable,
    contain?: (readonly T[] | null) | Iterable<T> | null | undefined,
  ) {
    // No de-duping: holding the same child in two fields contains it twice, so
    // swapping one field later (uncontain + contain) keeps it contained via the
    // other. But two fields pointing at the same marked object means they share
    // state, which is rarely intended (eg, new Clip(time, time)), so warn.
    // TODO: revisit this decision, see "Decisions to revisit" in
    // MARKED_STATE_REVIEW.md
    for (const child of contain ?? []) {
      if (subbableContainer._contain(holder, child) > 1) {
        console.warn(
          "SubbableMark.register: holder contains the same child more than once.",
          "Fields holding the same marked object share state.",
          { holder, child },
        );
      }
    }
  }

  public mutate<V>(
    struct: MarkedSubbable,
    mutator: (
      contain: (items: IterableCollection) => void,
      uncontain: (items: IterableCollection) => void,
    ) => V,
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
        (changes.uncontained = subbableContainer._uncontainAll(struct, items)),
    );

    subbableContainer._notifyChange(struct, struct);
    return result;
  }
}

export interface MarkedSubbable {
  readonly $$mark: SubbableMark;
}
