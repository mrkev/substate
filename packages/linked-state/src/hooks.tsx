import { useCallback, useEffect, useState } from "react";
import type { LinkedPrimitive, StateDispath } from "./LinkedPrimitive";
import { Subbable, subscribe } from "./Subbable";
import { SubbableContainer } from "./SubbableContainer";
import { MutationHashable } from "./MutationHashable";

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

  const apiState = linkedState.get();

  useEffect(() => {
    setState(() => apiState);
  }, [apiState]);

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
