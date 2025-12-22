import { useCallback, useSyncExternalStore } from "react";
import { subbable } from "../lib/Subbable";
import { MarkedSubbable } from "../lib/SubbableMark";
import { MarkedValue } from "./MarkedValue";

export function useLink<S extends MarkedSubbable>(
  obj: S,
  recursiveChanges: boolean = false
): () => S {
  "use no memo"; // dont memo this hook
  const _hash = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        return subbable.subscribe(obj, (target) => {
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
    useCallback(() => obj.$$mark._hash, [obj]),
    useCallback(() => obj.$$mark._hash, [obj])
  );
  return () => obj;
}

type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;

export function useLinkAsState<S>(prim: MarkedValue<S>): [S, StateDispath<S>] {
  // "use no memo" not needed afaik

  const externalStoreSub = useCallback(
    (onStoreChange: () => void) => {
      return subbable.subscribe(prim, (target) => {
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
    useCallback(() => prim.get(), [prim]),
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
