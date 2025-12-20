import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/marked-subbable";
import { isSerializable } from "./MarkedSerializable";

export function isSimplifiable(target: unknown) {
  return (
    isSerializable(target) ||
    target instanceof MarkedArray ||
    target instanceof MarkedMap ||
    target instanceof MarkedSet ||
    target instanceof MarkedValue
  );
}
