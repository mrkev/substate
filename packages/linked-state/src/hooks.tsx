import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { LinkedPrimitive, StateDispath } from "./LinkedPrimitive";
import { mutationHashable, MutationHashable } from "./MutationHashable";
import { Subbable, subscribe } from "./Subbable";
import { SubbableContainer } from "./SubbableContainer";

export function usePrimitive<S>(
  linkedState: LinkedPrimitive<S>
): [S, StateDispath<S>] {
  const [state, setState] = useState<S>(() => linkedState.get());

  useEffect(() => {
    return subscribe(linkedState, (target) => {
      if (target === linkedState) {
        setState(() => linkedState.get());
      }
    });
  }, [linkedState]);

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

  return [state, setter];
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

export function useContainer<S extends SubbableContainer>(
  obj: S,
  recursiveChanges: boolean = false
): S {
  useSubscribeToSubbableMutationHashable(obj, undefined, recursiveChanges);
  return obj;
}

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
