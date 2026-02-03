import { useState } from "react";
import { LinkedArray } from "../obj/LinkedArray";
import { LinkedMap } from "../obj/LinkedMap";
import { SSet } from "../obj/LinkedSet";
import { useSubscribeToSubbableMutationHashable } from "./hooks";

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

export function useNewLinkedArray<S>(): LinkedArray<S> {
  const [arr] = useState<LinkedArray<S>>(() => LinkedArray.create<S>());
  useSubscribeToSubbableMutationHashable(arr);
  return arr;
}
