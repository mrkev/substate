import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/marked-subbable";
import { isSerializable } from "./MarkedSerializable";
import { Primitive, Simplifiable } from "./simplify";

/** whether `target` is a marked (non-primitive) Simplifiable */
export function isSimplifiable(
  target: unknown,
): target is Exclude<Simplifiable, Primitive> {
  return (
    isSerializable(target) ||
    target instanceof MarkedArray ||
    target instanceof MarkedMap ||
    target instanceof MarkedSet ||
    target instanceof MarkedValue
  );
}
