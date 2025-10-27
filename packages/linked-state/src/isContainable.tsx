import { LinkedArray } from "./LinkedArray";
import { LinkedMap } from "./LinkedMap";
import { LinkedPrimitive } from "./LinkedPrimitive";
import { LinkedSet } from "./LinkedSet";

export function isContainable(
  val: unknown
): val is
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | LinkedSet<unknown>
  | LinkedMap<unknown, unknown> {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof LinkedArray ||
    val instanceof LinkedMap ||
    val instanceof LinkedSet
  );
}
