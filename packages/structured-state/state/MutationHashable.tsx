import { useEffect, useState } from "react";
import { Subbable, SubbableCallback, notify, subscribe } from "./Subbable";
import { Contained } from "./LinkedPrimitive";
import { isContainable } from "../src/assertions";

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
  implements MutationHashable, Subbable, Contained
{
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;
  // all containers can be contained
  public _container: SubbableContainer | null = null;

  constructor(id: string) {
    this._id = id;
  }

  // abstract _replace(val: T): void;

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

  static _uncontainAll(items: Array<unknown> | ReadonlySet<unknown>) {
    for (const item of items) {
      SubbableContainer._uncontain(item);
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
