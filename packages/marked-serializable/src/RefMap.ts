import { nullthrows } from "./nullthrows";
import { Simplified, SimplifiedRef } from "./simplify";

export type SimplifiedNonRef = Exclude<Simplified["any"], Simplified["ref"]>;

/**
 * id -> Simplified object
 */
export class RefMap {
  private readonly refmap = new Map<string, SimplifiedNonRef>();
  // ids of objects being serialized right now (between `markPending` and
  // `record`); meeting one of them again means it contains itself
  private readonly pending = new Set<string>();

  constructor(initial: Record<string, SimplifiedNonRef>) {
    for (const [key, value] of Object.entries(initial)) {
      this.refmap.set(key, value);
    }
  }

  has(_id: string): boolean {
    return this.refmap.has(_id);
  }

  isPending(_id: string): boolean {
    return this.pending.has(_id);
  }

  markPending(_id: string): void {
    this.pending.add(_id);
  }

  record(_id: string, simplified: SimplifiedNonRef): SimplifiedRef {
    this.pending.delete(_id);
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
