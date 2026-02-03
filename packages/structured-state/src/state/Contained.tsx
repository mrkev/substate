import { Struct } from "..";
import { Struct2 } from "../Struct2";
import { Structured } from "../Structured";
import { LinkedArray } from "./LinkedArray";
import { LinkedPrimitive } from "./LinkedPrimitive";
import { SSet } from "./LinkedSet";
import { Subbable } from "./Subbable";

export interface Contained {
  readonly _container: Set<Subbable>;
}
export type Containable =
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>;

export function isContainable(
  val: unknown,
): val is
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | Struct<any>
  | Struct2<any>
  | Structured<any, any>
  | SSet<unknown> {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof LinkedArray ||
    val instanceof Struct ||
    val instanceof Struct2 ||
    val instanceof Structured ||
    val instanceof SSet
  );
}
