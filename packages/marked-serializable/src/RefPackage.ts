import { nullthrows } from "./nullthrows";
import { Simplified, SimplifiedRef } from "./simplify";

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
    _id: string,
    simplified: Exclude<Simplified["any"], Simplified["ref"]>
  ): SimplifiedRef {
    if (!this.refmap.has(_id)) {
      this.refmap.set(_id, simplified);
    }
    return { $$: "ref", _id: _id } as const;
  }

  get(_id: string): Exclude<Simplified["any"], Simplified["ref"]> {
    return nullthrows(this.refmap.get(_id), `ref ${_id} not found`);
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
