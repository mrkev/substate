import { useCallback, useEffect, useState } from "react";
import type { SPrimitive, StateDispath } from "./state/LinkedState";
import { subscribe } from "./state/Subbable";
import { SArray, SState, Struct } from "./sstate";
import { useSubscribeToSubbableMutationHashable } from "./state/LinkedMap";

export function useSPrimitive<S>(
  linkedState: SPrimitive<S>
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

export function useContainer<S extends SState<unknown> | Struct<any>>(
  linkedArray: SArray<S>
): [SArray<S>, StateDispath<Array<S>>] {
  useSubscribeToSubbableMutationHashable(linkedArray);

  const setter: StateDispath<Array<S>> = useCallback(
    function (newVal) {
      if (newVal instanceof Function) {
        linkedArray._setRaw(newVal(linkedArray._getRaw() as any));
      } else {
        linkedArray._setRaw(newVal);
      }
    },
    [linkedArray]
  );

  return [linkedArray, setter];
}
