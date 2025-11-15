import { LinkableArray } from "../src/LinkableArray";
import { LinkableMap } from "../src/LinkableMap";
import { LinkableSet } from "../src/LinkableSet";
import { LinkableValue } from "../src/LinkableValue";
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
