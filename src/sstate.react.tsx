import { useCallback, useEffect, useState } from "react";
import { SArray, SState, Struct } from "./sstate";
import { useSubscribeToSubbableMutationHashable } from "./lib/state/LinkedMap";
import type { SPrimitive, StateDispath } from "./lib/state/LinkedState";
import { MutationHashable } from "./lib/state/MutationHashable";
import { subscribe } from "./lib/state/Subbable";

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

export function useSubToStruct<S extends Struct<any>>(obj: S) {
  const [, setHash] = useState(() => MutationHashable.getMutationHash(obj));

  useEffect(() => {
    return subscribe(obj, () => {
      setHash((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
    });
  }, [obj]);

  return obj;
}
