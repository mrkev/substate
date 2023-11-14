import { Subbable, SubbableCallback } from "./Subbable";

export class MutationHashable implements Subbable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  _hash: number = 0;

  static getMutationHash(mh: MutationHashable) {
    return mh._hash;
  }

  static mutated(mh: MutationHashable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
  }
}

export abstract class SubbableContainer implements MutationHashable {
  readonly _subscriptors: Set<SubbableCallback> = new Set();
  _hash: number = 0;

  abstract _childChanged(child: Subbable): void;

  static getMutationHash(mh: MutationHashable) {
    return mh._hash;
  }

  static mutated(mh: MutationHashable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
  }
}
