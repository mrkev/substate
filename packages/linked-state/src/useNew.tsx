import { useState } from "react";
import { LinkedArray } from "./LinkedArray";
import { LinkedMap } from "./LinkedMap";
import { LinkedSet } from "./LinkedSet";
import { useSubscribeToSubbableMutationHashable } from "./hooks";

// TODO: rename to `useCreateAndLinkSet`, etc, and link? Or delete?

export function useNewLinkedSet<S>(): LinkedSet<S> {
  const [set] = useState<LinkedSet<S>>(() => LinkedSet.create<S>());

  // useSubscribeToSubbableMutationHashable(set);
  return set;
}

export function useNewLinkedMap<K, V>(): LinkedMap<K, V> {
  const [map] = useState<LinkedMap<K, V>>(() => LinkedMap.create<K, V>());
  // useSubscribeToSubbableMutationHashable(map);
  return map;
}

export function useNewLinkedArray<S>(): LinkedArray<S> {
  const [arr] = useState<LinkedArray<S>>(() => LinkedArray.create<S>());
  // useSubscribeToSubbableMutationHashable(arr);
  return arr;
}
