import { LinkableArray } from "./LinkableArray";
import { LinkableMap } from "./LinkableMap";
import { LinkableValue } from "./LinkableValue";
import { LinkableSet } from "./LinkableSet";
import { Subbable } from "./Subbable";

export interface Contained {
  readonly _container: Set<Subbable>;
}

export function isContainable(
  val: unknown
): val is
  | LinkableValue<unknown>
  | LinkableArray<unknown>
  | LinkableSet<unknown>
  | LinkableMap<unknown, unknown> {
  return (
    val instanceof LinkableValue ||
    val instanceof LinkableArray ||
    val instanceof LinkableMap ||
    val instanceof LinkableSet
  );
}
