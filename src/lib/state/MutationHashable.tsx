import { useEffect, useState } from "react";
import { Subbable, SubbableCallback, notify, subscribe } from "./Subbable";
import { isContainable } from "../../assertions";
import { Contained } from "./LinkedPrimitive";

export class MutationHashable implements Subbable {
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

export abstract class SubbableContainer implements MutationHashable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;

  abstract _childChanged(child: Subbable): void;

  static _contain(container: SubbableContainer, items: Array<unknown>) {
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
