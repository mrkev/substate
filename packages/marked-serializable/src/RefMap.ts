import { nullthrows } from "./nullthrows";
import { Simplified, SimplifiedRef } from "./simplify";

type SimplifiedNonRef = Exclude<Simplified["any"], Simplified["ref"]>;

/**
 * id -> Simplified object
 */
export class RefMap {
  private readonly refmap = new Map<string, SimplifiedNonRef>();

  constructor(initial: Record<string, SimplifiedNonRef>) {
    for (const [key, value] of Object.entries(initial)) {
      this.refmap.set(key, value);
    }
  }

  record(_id: string, simplified: SimplifiedNonRef): SimplifiedRef {
    if (!this.refmap.has(_id)) {
      this.refmap.set(_id, simplified);
    }
    return { $$: "ref", _id: _id } as const;
  }

  get(_id: string): SimplifiedNonRef {
    return nullthrows(this.refmap.get(_id), `ref ${_id} not found`);
  }

  index() {
    const result: Record<string, SimplifiedNonRef> = {};
    for (const [_id, value] of this.refmap) {
      result[_id] = value;
    }
    return result;
  }
}
