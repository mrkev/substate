import { useCallback, useEffect, useState } from "react";
import { Structured } from "./Structured";
import type { LinkedPrimitive, StateDispath } from "../state/LinkedPrimitive";
import {
  SubbableContainer,
  useSubscribeToSubbableMutationHashable,
} from "../state/MutationHashable";
import { subscribe } from "../state/Subbable";
import { SArray } from "./sstate";

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

export function useStructure<S>(
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

export function useContainer<S extends SubbableContainer>(
  obj: S,
  allChanges: boolean = false
): S {
  useSubscribeToSubbableMutationHashable(obj, undefined, allChanges);
  return obj;
}

export function useIsDirty<S extends Structured<any, any>>(obj: S): boolean {
  useSubscribeToSubbableMutationHashable(obj, undefined, true);
  console.log("isClean?", obj._isClean());
  return !obj._isClean();
}
