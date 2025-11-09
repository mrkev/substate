import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { LinkedPrimitive, StateDispath } from "./LinkedPrimitive";
import { mutationHashable, MutationHashable } from "./MutationHashable";
import { Subbable, subscribe } from "./Subbable";

export function usePrimitive<S>(
  linkedState: LinkedPrimitive<S>
): [S, StateDispath<S>] {
  // "use no memo" not needed afaik

  const externalStoreSub = useCallback(
    (onStoreChange: () => void) => {
      return subscribe(linkedState, (target) => {
        // console.log(
        //   "got notif",
        //   obj,
        //   "target is",
        //   target,
        //   "notifying?",
        //   obj === target || recursiveChanges
        // );
        if (linkedState === target) {
          onStoreChange();
        }
      });
    },
    [linkedState]
  );

  const value = useSyncExternalStore(
    externalStoreSub,
    useCallback(() => linkedState.get(), [linkedState])
  );

  const setter: StateDispath<S> = useCallback(
    (newVal) => {
      if (newVal instanceof Function) {
        linkedState.set(newVal(linkedState.get()));
      } else {
        linkedState.set(newVal);
      }
    },
    [linkedState]
  );

  return [value, setter];
}

export function useLink<S extends Subbable & MutationHashable>(
  obj: S,
  recursiveChanges: boolean = false
): () => S {
  "use no memo"; // dont memo this hook
  const _hash = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        return subscribe(obj, (target) => {
          // console.log(
          //   "got notif",
          //   obj,
          //   "target is",
          //   target,
          //   "notifying?",
          //   obj === target || recursiveChanges
          // );
          if (obj === target || recursiveChanges) {
            onStoreChange();
          }
        });
      },
      [obj, recursiveChanges]
    ),
    useCallback(() => obj._hash, [obj])
  );
  return () => obj;
}

// TODO: remove
export function useSubscribeToSubbableMutationHashable<
  T extends MutationHashable & Subbable
>(obj: T, cb?: () => void, recursiveChanges = false): T {
  const [hash, setHash] = useState(() => mutationHashable.getMutationHash(obj));

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
