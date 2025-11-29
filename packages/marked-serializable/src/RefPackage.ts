import { Primitive, Simplifiable, Simplified, SimplifiedRef } from "./simplify";

export class RefPackage {
  constructor(
    initial: Record<string, Exclude<Simplified["any"], Simplified["ref"]>>
  ) {
    for (const [key, value] of Object.entries(initial)) {
      this.refmap.set(key, value);
    }
  }

  private readonly refmap = new Map<
    string,
    Exclude<Simplified["any"], Simplified["ref"]>
  >();

  record(
    obj: Exclude<Simplifiable, Primitive>,
    simplified: Exclude<Simplified["any"], Simplified["ref"]>
  ): SimplifiedRef {
    if (!this.refmap.has(obj.$$mark._id)) {
      this.refmap.set(obj.$$mark._id, simplified);
    }
    return { $$: "ref", _id: obj.$$mark._id } as const;
  }

  refs() {
    const result: Record<
      string,
      Exclude<Simplified["any"], Simplified["ref"]>
    > = {};
    for (const [_id, value] of this.refmap) {
      result[_id] = value;
    }
    return result;
  }
}
