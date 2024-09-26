import { isContainable } from "../assertions";
import { Contained } from "./LinkedPrimitive";
import { MutationHashable } from "./MutationHashable";
import { Subbable, SubbableCallback } from "./Subbable";

export abstract class SubbableContainer
  implements MutationHashable, Subbable, Contained
{
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;
  // all containers can be contained
  public _container: SubbableContainer | null = null;
  // public _propagatedNotifs = new WeakSet();

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
    const token = {};
    // struct._propagatedNotifs.add(token);

    MutationHashable.mutated(struct, target);
    if (struct._container != null) {
      // struct._container._childChanged(target);
      SubbableContainer._childChanged(struct._container, target);
    }
  }

  static _childChanged(parent: SubbableContainer, target: Subbable) {
    MutationHashable.mutated(parent, target);
    if (parent._container != null) {
      SubbableContainer._childChanged(parent._container, target);
    }
  }
}
