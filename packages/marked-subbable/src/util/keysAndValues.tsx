/** @returns a generator that iterates over all keys followed by all values in a Map */
export function* keysAndValues<K, V>(map: Map<K, V>): Generator<K | V> {
  yield* map.keys();
  yield* map.values();
}
