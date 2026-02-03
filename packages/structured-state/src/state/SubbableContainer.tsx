import { isContainable } from "./Contained";
import { Contained } from "./Contained";
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

export abstract class SubbableContainer
  implements MutationHashable, Subbable, Contained
{
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;
  // all containers can be contained
  public readonly _container = new Set<SubbableContainer>();
  public readonly _propagatedTokens = new WeakSet<UpdateToken>();

  // abstract _replace(val: T): void;
  // abstract _childChanged(child: Subbable): void;

  constructor(id: string) {
    this._id = id;
  }
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
