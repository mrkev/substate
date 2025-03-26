import { useCallback, useEffect, useState } from "react";
import type { LinkedPrimitive, StateDispath } from "./LinkedPrimitive";
import { useSubscribeToSubbableMutationHashable } from "./MutationHashable";
import { subscribe } from "./Subbable";
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
