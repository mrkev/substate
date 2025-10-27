import { Subbable, SubbableCallback, notify } from "./Subbable";

export abstract class MutationHashable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;

  static getMutationHash(mh: MutationHashable) {
    return mh._hash;
  }

  static mutated(mh: MutationHashable, target: Subbable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
    notify(mh, target);
  }
}
