import { useCallback, useSyncExternalStore } from "react";
import { subbable } from "../lib/Subbable";
import { MarkedSubbable } from "../lib/SubbableMark";

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
