import { useCallback, useEffect, useState } from "react";
import { Structured } from "./Structured";
import type { LinkedPrimitive, StateDispath } from "./state/LinkedPrimitive";
import { useSubscribeToSubbableMutationHashable } from "./state/MutationHashable";
import { SubbableContainer } from "./state/SubbableContainer";
import { subscribe } from "./state/Subbable";
import { SArray } from "./SArray";

export function useSPrimitive<S>(
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
      // newVal instanceof Function
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
