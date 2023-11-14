import { getGlobalState } from "../..";
import { StateChangeHandler } from "./LinkedPrimitive";

/* Subbables are objects one can subscribe to */

export type SubbableCallback = (changed: Subbable, notified: Subbable) => void;

export interface Subbable {
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
  const globalState = getGlobalState();
  if (subbable !== globalState.history) {
    // console.log(
    //   "SENDING NOTIF TO",
    //   subbable._subscriptors.size,
    //   "CHANGED:",
    //   subbable
    // );
  }
  subbable._subscriptors.forEach((cb) => {
    cb(target, subbable);
  });
}
