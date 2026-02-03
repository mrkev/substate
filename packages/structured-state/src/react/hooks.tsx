import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { LinkedPrimitive } from "../obj/LinkedPrimitive";
import { MutationHashable } from "../state/MutationHashable";
import { Subbable, subscribe } from "../state/Subbable";
import { SubbableContainer } from "../state/SubbableContainer";

export type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;

export function usePrimitive<S>(
  linkedState: LinkedPrimitive<S>,
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
    [linkedState],
  );

  return [state, setter];
}

export function useContainer<S extends SubbableContainer>(
  obj: S,
  recursiveChanges: boolean = false,
): S {
  useSubscribeToSubbableMutationHashable(obj, undefined, recursiveChanges);
  return obj;
}

export function useSubscribeToSubbableMutationHashable<
  T extends MutationHashable & Subbable,
>(obj: T, cb?: () => void, recursiveChanges = false): T {
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
            cb?.();
          }
        });
      },
      [cb, obj, recursiveChanges],
    ),
    useCallback(() => obj._hash, [obj]),
    useCallback(() => obj._hash, [obj]),
  );
  return obj;
}
