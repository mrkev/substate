/**
 * Subbables are objects one can subscribe to. All Subbables include:
 * - a set of callbacks to be called on mutation
 */

export type SubbableCallback = (changed: Subbable, notified: Subbable) => void;

export interface Subbable {
  readonly _subscriptors: Set<SubbableCallback>;
}

export function subscribe(
  subbable: Subbable,
  cb: SubbableCallback,
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
  target: Subbable,
) {
  // console.log(
  //   "SENDING NOTIF TO",
  //   subbable._subscriptors.size,
  //   "CHANGED:",
  //   subbable.constructor.name
  // );

  for (const cb of subbable._subscriptors) {
    cb(target, subbable);
  }
}
