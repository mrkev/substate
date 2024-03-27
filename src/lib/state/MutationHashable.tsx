import { useEffect, useState } from "react";
import { isContainable } from "../../assertions";
import { Subbable, SubbableCallback, notify, subscribe } from "./Subbable";
import { Contained } from "./LinkedPrimitive";

export abstract class MutationHashable implements Subbable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  _hash: number = 0;

  static getMutationHash(mh: MutationHashable) {
    return mh._hash;
  }

  static mutated(mh: MutationHashable, target: Subbable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
    notify(mh, target);
  }
}

export abstract class SubbableContainer
  // all containers can be contained
  implements MutationHashable, Subbable, Contained
{
  readonly _id: string;
  public _container: SubbableContainer | null = null;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;

  constructor(id: string) {
    this._id = id;
  }

  abstract _childChanged(child: Subbable): void;

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
}

export function useSubscribeToSubbableMutationHashable<
  T extends MutationHashable & Subbable
>(obj: T, cb?: () => void, recursiveChanges = false): T {
  const [, setHash] = useState(() => MutationHashable.getMutationHash(obj));

  useEffect(() => {
    return subscribe(obj, (target) => {
      // console.log("got notif", obj, "target is", target);
      if (obj === target || recursiveChanges) {
        setHash((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
        cb?.();
      }
    });
  }, [cb, obj, recursiveChanges]);

  return obj;
}
