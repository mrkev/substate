import { SubbableMark } from "@mrkev/marked-subbable";
import { Simplifiable } from "./simplify";

export type Description = Record<string, Simplifiable>;

/**
 * A SerializationMark of any kind. Its type parameters appear both as inputs
 * and outputs (construct/describe), so no specific mark is assignable to any
 * other instantiation; `any` here stands for "some D and C".
 */
export type AnySerializationMark = SerializationMark<any, any>;

export interface MarkedSerializable<M extends AnySerializationMark> {
  // We want MarkedSerializables to also be MarkedSubbables to get the id for the object.
  // We use the id for packaging, where we serialize nodes as refs, to serialize non-tree graphs
  readonly $$mark: SubbableMark;
  readonly $$serialization: M;
}

export class SerializationMark<
  D extends Description,
  C extends MarkedSerializable<AnySerializationMark>,
> {
  constructor(
    readonly kind: string,
    readonly construct: (description: D) => C,
    readonly describe: (constructed: C) => D,
  ) {}
  static create<
    D extends Description,
    C extends MarkedSerializable<AnySerializationMark>,
  >({
    kind,
    construct,
    simplify,
  }: {
    kind: string;
    construct: (description: D) => C;
    simplify: (constructed: C) => D;
  }) {
    return new SerializationMark(kind, construct, simplify);
  }
}

export function isSerializable(
  value: unknown,
): value is MarkedSerializable<AnySerializationMark> {
  return (
    typeof value === "object" &&
    value !== null &&
    "$$serialization" in value &&
    value.$$serialization instanceof SerializationMark
  );
}

export type SerializationIndex = Map<string, AnySerializationMark>;

export function consolidateMarks(
  marks: AnySerializationMark[],
): SerializationIndex {
  const map: SerializationIndex = new Map();
  for (const mark of marks) {
    if (map.has(mark.kind)) {
      throw new Error(`Duplicate mark ${mark.kind}!`);
    }
    map.set(mark.kind, mark);
  }
  return map;
}
