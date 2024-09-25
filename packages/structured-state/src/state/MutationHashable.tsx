import { useEffect, useState } from "react";
import { Subbable, SubbableCallback, notify, subscribe } from "./Subbable";

export abstract class MutationHashable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;

  static getMutationHash(mh: MutationHashable) {
    return mh._hash;
  }

  static mutated(mh: MutationHashable, target: Subbable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
    notify(mh, target);
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
