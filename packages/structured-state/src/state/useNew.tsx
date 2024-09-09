import { useState } from "react";
import { LinkedMap } from "./LinkedMap";
import { LinkedSet } from "./LinkedSet";
import { useSubscribeToSubbableMutationHashable } from "./MutationHashable";

export function useNewLinkedSet<S>(): LinkedSet<S> {
  const [set] = useState<LinkedSet<S>>(() => LinkedSet.create<S>());
  useSubscribeToSubbableMutationHashable(set);
  return set;
}

export function useNewLinkedMap<K, V>(): LinkedMap<K, V> {
  const [map] = useState<LinkedMap<K, V>>(() => LinkedMap.create<K, V>());
  useSubscribeToSubbableMutationHashable(map);
  return map;
}

// todo: use new linked array
