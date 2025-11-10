import { useState } from "react";
import { LinkableArray } from "./LinkableArray";
import { LinkableMap } from "./LinkableMap";
import { LinkableSet } from "./LinkableSet";
import { useSubscribeToSubbableMutationHashable } from "./hooks";

// TODO: rename to `useCreateAndLinkSet`, etc, and link? Or delete?

export function useNewLinkedSet<S>(): LinkableSet<S> {
  const [set] = useState<LinkableSet<S>>(() => LinkableSet.create<S>());

  // useSubscribeToSubbableMutationHashable(set);
  return set;
}

export function useNewLinkedMap<K, V>(): LinkableMap<K, V> {
  const [map] = useState<LinkableMap<K, V>>(() => LinkableMap.create<K, V>());
  // useSubscribeToSubbableMutationHashable(map);
  return map;
}

export function useNewLinkedArray<S>(): LinkableArray<S> {
  const [arr] = useState<LinkableArray<S>>(() => LinkableArray.create<S>());
  // useSubscribeToSubbableMutationHashable(arr);
  return arr;
}
