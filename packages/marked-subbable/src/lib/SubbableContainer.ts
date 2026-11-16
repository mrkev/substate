import { isContainable } from "./Contained";
import { subbable, SubbableCallback } from "./Subbable";
import { MarkedSubbable } from "./SubbableMark";

/**
 * A token is unique to an update (a call to _notifyChange). It serves two purposes:
 * - it helps us prevent loops by ensuring an event isn't processed twice
 * - it holds the target of the update, acting like an "event" in that sense: a record of the update
 */
export class UpdateToken {
  constructor(public readonly target: MarkedSubbable) {}
}

export type IterableCollection =
  | Array<unknown>
  | Iterable<unknown>
  | ReadonlySet<unknown>
  | IterableIterator<unknown>;

//  implements Subbable, Contained
export interface SubbableContainer {
  readonly _propagatedTokens: WeakSet<UpdateToken>;

  // Subbable
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback>;
  _hash: number;

  // Contained
  // all containers can be contained. container => number of times it contains us
  readonly _container: Map<MarkedSubbable, number>;
}

export const subbableContainer = {
  // abstract _replace(val: T): void;

  /**
   * Records that `container` holds one more copy of `item`.
   * @returns how many copies of `item` `container` now holds, or 0 if `item`
   * isn't containable
   */
  _contain(container: MarkedSubbable, item: unknown): number {
    if (!isContainable(item)) {
      return 0;
    }
    const containers = item.$$mark._container;
    const count = (containers.get(container) ?? 0) + 1;
    containers.set(container, count);
    return count;
  },

  _containAll(container: MarkedSubbable, items: IterableCollection) {
    const contained = [];
    for (const elem of items) {
      if (!isContainable(elem)) {
        continue;
      }
      subbableContainer._contain(container, elem);
      contained.push(elem);
    }
    return contained;
  },

  _uncontainAll(container: MarkedSubbable, items: IterableCollection) {
    const uncontained = [];
    for (const item of items) {
      if (!isContainable(item)) {
        continue;
      }

      const containers = item.$$mark._container;
      const count = containers.get(container);
      if (count == null) {
        console.warn("_uncontain:", container, "does not contain", item);
      } else if (count > 1) {
        // container still holds other copies of this item
        containers.set(container, count - 1);
      } else {
        containers.delete(container);
      }
      // TODO: safety
      if ("_destroy" in item && typeof item._destroy === "function") {
        item._destroy();
      }
      uncontained.push(item);
    }
    return uncontained;
  },

  /**
   * Creates a change notification to be propagated, starting at this object,
   * and about the change of a certain target
   */
  _notifyChange(struct: MarkedSubbable, target: MarkedSubbable) {
    const token = new UpdateToken(target);
    struct.$$mark._propagatedTokens.add(token);

    // console.log(
    //   "[_notifyChange]: ",
    //   printId(struct),
    //   "changed:",
    //   printId(target)
    // );

    subbable.mutated(struct, target);
    for (const container of struct.$$mark._container.keys()) {
      subbableContainer._childChanged(container, token);
    }

    // it's a weak set, we don't need to remove
    // struct._propagatedTokens.delete(token)
  },

  _childChanged(struct: MarkedSubbable, token: UpdateToken) {
    // console.log(
    //   "[_childChanged]: ",
    //   printId(struct),
    //   struct.$$mark._container,
    //   "token:",
    //   token
    // );

    if (struct.$$mark._propagatedTokens.has(token)) {
      console.log("token seen");
      // we already processed this event. stop here to prevent loops
      return;
    }
    struct.$$mark._propagatedTokens.add(token);

    subbable.mutated(struct, token.target);
    for (const container of struct.$$mark._container.keys()) {
      subbableContainer._childChanged(container, token);
    }

    // it's a weak set, we don't need to remove
    // struct._propagatedTokens.delete(token)
  },
};
