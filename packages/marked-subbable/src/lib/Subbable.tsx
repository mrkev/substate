// import { printId } from "./printId";

import { MarkedSubbable } from "./SubbableMark";

export type SubbableCallback = (
  changed: MarkedSubbable, // what changed
  notified: MarkedSubbable // what we're notifying of a change
) => void;

/**
 * Subbables are objects one can subscribe to. All Subbables include:
 * - an id to identify
 * - a set of callbacks to be called on mutation
 * - a hash to version
 */
export interface Subbable {
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback>;

  _hash: number;
}

export const subbable = {
  /**
   * Records a callback, so that changes to "subbable" trigger a call of "callback"
   */
  subscribe(mh: MarkedSubbable, cb: SubbableCallback): () => void {
    mh.$$mark._subscriptors.add(cb);
    return () => mh.$$mark._subscriptors.delete(cb);
  },

  /**
   * @param mh what we're notifying of a change
   * @param target what changed
   *  this is the recursive child that changed, subscribers can choose to
   *  act differently based on weather it was the object they're listening to
   *  that changed, or a recursive child
   */
  mutated(mh: MarkedSubbable, target: MarkedSubbable) {
    mh.$$mark._hash = (mh.$$mark._hash + 1) % Number.MAX_SAFE_INTEGER;

    // notify
    for (const cb of mh.$$mark._subscriptors) {
      cb(target, mh);
    }
  },
};
