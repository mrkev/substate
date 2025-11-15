import { Subbable, SubbableCallback, notify } from "./Subbable";

export interface MutationHashable {
  _hash: number;

  // Subbable
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback>;
}

export const mutationHashable = {
  getMutationHash(mh: MutationHashable) {
    return mh._hash;
  },

  mutated(mh: MutationHashable, target: Subbable) {
    mh._hash = (mh._hash + 1) % Number.MAX_SAFE_INTEGER;
    notify(mh, target);
  },
};
