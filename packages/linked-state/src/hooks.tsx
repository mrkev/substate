import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { LinkableValue, StateDispath } from "./LinkableValue";
import { mutationHashable, MutationHashable } from "../lib/MutationHashable";
import { Subbable, subscribe } from "../lib/Subbable";

export function useLinkAsState<S>(
  prim: LinkableValue<S>
): [S, StateDispath<S>] {
  // "use no memo" not needed afaik

  const externalStoreSub = useCallback(
    (onStoreChange: () => void) => {
      return subscribe(prim, (target) => {
        // console.log(
        //   "got notif",
        //   obj,
        //   "target is",
        //   target,
        //   "notifying?",
        //   obj === target || recursiveChanges
        // );
        if (prim === target) {
          onStoreChange();
        }
      });
    },
    [prim]
  );

  const value = useSyncExternalStore(
    externalStoreSub,
    useCallback(() => prim.get(), [prim])
  );

  const setter: StateDispath<S> = useCallback(
    (newVal) => {
      if (newVal instanceof Function) {
        prim.set(newVal(prim.get()));
      } else {
        prim.set(newVal);
      }
    },
    [prim]
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
