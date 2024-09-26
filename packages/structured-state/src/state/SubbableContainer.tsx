import { isContainable } from "../assertions";
import { Contained } from "./LinkedPrimitive";
import { MutationHashable } from "./MutationHashable";
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

export abstract class SubbableContainer
  implements MutationHashable, Subbable, Contained
{
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;
  // all containers can be contained
  public _container: SubbableContainer | null = null;
  public _propagatedTokens: WeakSet<UpdateToken> = new WeakSet();

  constructor(id: string) {
    this._id = id;
  }

  // abstract _replace(val: T): void;
  // abstract _childChanged(child: Subbable): void;

  static _contain(
    container: SubbableContainer,
    items: Array<unknown> | ReadonlySet<unknown>
  ) {
    for (const elem of items) {
      if (isContainable(elem)) {
        elem._container = container;
      }
    }
  }

  static _uncontain(item: unknown) {
    if (isContainable(item)) {
      item._container = null;
      // TODO: safety
      if ("_destroy" in item) {
        item._destroy();
      }
    }
  }

  static _uncontainAll(items: Array<unknown> | ReadonlySet<unknown>) {
    for (const item of items) {
      SubbableContainer._uncontain(item);
    }
  }

  /**
   * Creates a change notification to be propagated, starting at this object, and about change of a certain target
   */
  static _notifyChange(struct: SubbableContainer, target: SubbableContainer) {
    const token = new UpdateToken(target);
    struct._propagatedTokens.add(token);

    MutationHashable.mutated(struct, target);
    if (struct._container != null) {
      // struct._container._childChanged(target);
      SubbableContainer._childChanged(struct._container, token);
    }
  }

  static _childChanged(node: SubbableContainer, token: UpdateToken) {
    if (node._propagatedTokens.has(token)) {
      // we already processed this event. stop here to prevent loops
      return;
    }

    node._propagatedTokens.add(token);

    MutationHashable.mutated(node, token.target);
    if (node._container != null) {
      SubbableContainer._childChanged(node._container, token);
    }
  }
}
