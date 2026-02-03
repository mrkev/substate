import { Contained, isContainable } from "./Contained";
import { mutationHashable, MutationHashable } from "./MutationHashable";
import { Subbable, SubbableCallback } from "./Subbable";

/** Keys to ignore from SubbableContainer when serializing */
export const CONTAINER_IGNORE_KEYS = new Set<string>([
  "_id",
  "_hash",
  "_subscriptors",
  "_container",
  "_propagatedTokens",
]);

/**
 * A token is unique to an update (a call to _notifyChange). It serves two purposes:
 * - it helps us prevent loops by ensuring an event isn't processed twice
 * - it holds the target of the update, acting like an "event" in that sense: a record of the update
 */
export class UpdateToken {
  constructor(public target: Subbable) {}
}

export type IterableCollection =
  | Array<unknown>
  | ReadonlySet<unknown>
  | IterableIterator<unknown>;

export interface SubbableContainer
  extends MutationHashable, Subbable, Contained {
  readonly _propagatedTokens: WeakSet<UpdateToken>;

  // Subbable
  readonly _subscriptors: Set<SubbableCallback>;

  // MutationHashable
  readonly _id: string;
  _hash: number;

  // Contained
  // all containers can be contained
  readonly _container: Set<SubbableContainer>;

  // abstract _replace(val: T): void;
  // abstract _childChanged(child: Subbable): void;
}

export const subbableContainer = {
  _contain(container: SubbableContainer, item: unknown) {
    if (isContainable(item)) {
      item._container.add(container);
    }
  },

  _containAll(container: SubbableContainer, items: IterableCollection) {
    for (const elem of items) {
      if (isContainable(elem)) {
        elem._container.add(container);
      }
    }
  },

  _uncontain(container: SubbableContainer, item: unknown) {
    if (isContainable(item)) {
      if (!item._container.has(container)) {
        console.warn("_uncontain:", item._container, "does not contain", item);
      }

      item._container.delete(container);
      // TODO: safety
      if ("_destroy" in item) {
        item._destroy();
      }
    }
  },

  _uncontainAll(container: SubbableContainer, items: IterableCollection) {
    for (const item of items) {
      subbableContainer._uncontain(container, item);
    }
  },

  /**
   * Creates a change notification to be propagated, starting at this object,
   * and about the change of a certain target
   */
  _notifyChange(struct: SubbableContainer, target: SubbableContainer) {
    const token = new UpdateToken(target);
    struct._propagatedTokens.add(token);

    mutationHashable.mutated(struct, target);
    for (const container of struct._container) {
      subbableContainer._childChanged(container, token);
    }

    // it's a weak set, we don't need to remove
    // struct._propagatedTokens.delete(token)
  },

  _childChanged(node: SubbableContainer, token: UpdateToken) {
    if (node._propagatedTokens.has(token)) {
      // we already processed this event. stop here to prevent loops
      return;
    }
    node._propagatedTokens.add(token);

    mutationHashable.mutated(node, token.target);
    for (const container of node._container) {
      subbableContainer._childChanged(container, token);
    }

    // it's a weak set, we don't need to remove
    // struct._propagatedTokens.delete(token)
  },
};
