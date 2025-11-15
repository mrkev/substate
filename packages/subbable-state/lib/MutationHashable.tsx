import { Subbable, SubbableCallback, notify } from "./Subbable";

export interface MutationHashable {
  readonly _subscriptors: Set<SubbableCallback>;
  _hash: number;

  // Subbable
  _id: string;
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
