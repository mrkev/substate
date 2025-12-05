import { SubbableMark } from "@mrkev/marked-subbable";
import { Simplifiable } from "./simplify";

type Descriptor = Record<string, Simplifiable>;
export interface MarkedSerializable<M extends SerializationMark<any, any>> {
  // We want MarkedSerializables to also be MarkedSubbables to get the id for the object.
  // We use the id for packaging, where we serialize nodes as refs, to serialize non-tree graphs
  readonly $$mark: SubbableMark;
  readonly $$serialization: M;
}

export class SerializationMark<
  D extends Descriptor,
  C extends MarkedSerializable<any>
> {
  constructor(
    readonly kind: string,
    readonly construct: (description: D) => C,
    readonly describe: (constructed: C) => D
  ) {}
  static create<D extends Descriptor, C extends MarkedSerializable<any>>({
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
  value: unknown
): value is MarkedSerializable<any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "$$serialization" in value &&
    value.$$serialization instanceof SerializationMark
  );
}

export type SerializationIndex = Map<string, SerializationMark<any, any>>;

export function consolidateMarks(
  marks: SerializationMark<any, any>[]
): SerializationIndex {
  const map = new Map<string, SerializationMark<any, any>>();
  for (const mark of marks) {
    if (map.has(mark.kind)) {
      throw new Error(`Duplicate mark ${mark.kind}!`);
    }
    map.set(mark.kind, mark);
  }
  return map;
}
