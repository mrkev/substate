import { useState } from "react";
import { LinkedMap } from "./LinkedMap";
import { SSet } from "./LinkedSet";
import { useSubscribeToSubbableMutationHashable } from "./MutationHashable";

export function useNewLinkedSet<S>(): SSet<S> {
  const [set] = useState<SSet<S>>(() => SSet._create<S>());
  useSubscribeToSubbableMutationHashable(set);
  return set;
}

export function useNewLinkedMap<K, V>(): LinkedMap<K, V> {
  const [map] = useState<LinkedMap<K, V>>(() => LinkedMap.create<K, V>());
  useSubscribeToSubbableMutationHashable(map);
  return map;
}

// todo: use new linked array
