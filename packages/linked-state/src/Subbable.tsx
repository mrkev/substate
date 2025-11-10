import type { StateChangeHandler } from "./LinkableValue";
import { printId } from "./printId";

/* Subbables are objects one can subscribe to */

export type SubbableCallback = (changed: Subbable, notified: Subbable) => void;

export interface Subbable {
  readonly _id: string;
  readonly _subscriptors: Set<SubbableCallback>;
}

export function subscribe(
  subbable: Subbable,
  cb: StateChangeHandler<Subbable>
): () => void {
  subbable._subscriptors.add(cb);
  return () => subbable._subscriptors.delete(cb);
}

export function notify(
  // this changed, notify subscribers to this Subbable
  subbable: Subbable,
  // this is the recursive child that changed, subscribers can choose to
  // act differently based on weather it was the object they're listening to
  // that changed, or a recursive child
  target: Subbable
) {
  // console.log(
  //   "[notify]",
  //   subbable._subscriptors.size,
  //   "subs of",
  //   `(${printId(subbable as any)})`,
  //   "changed:",
  //   `(${printId(target as any)})`
  // );

  for (const cb of subbable._subscriptors) {
    cb(target, subbable);
  }
}
