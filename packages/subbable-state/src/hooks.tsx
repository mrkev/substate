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
        return subbable.subscribe(obj.$$token, (target) => {
          // console.log(
          //   "got notif",
          //   obj,
          //   "target is",
          //   target,
          //   "notifying?",
          //   obj === target || recursiveChanges
          // );
          if (obj.$$token === target || recursiveChanges) {
            onStoreChange();
          }
        });
      },
      [obj, recursiveChanges]
    ),
    useCallback(() => obj.$$token._hash, [obj])
  );
  return () => obj;
}
