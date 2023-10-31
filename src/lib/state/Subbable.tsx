import { StateChangeHandler } from "./LinkedState";

// Subbables are things one can subscribe to

export type SubbableCallback = (changed: Subbable, notified: Subbable) => void;

// export interface SubbableContainer {
//   _childChanged:
// }

export interface Subbable {
  _subscriptors: Set<SubbableCallback>;
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
  target: Subbable,
  priority: "task" | "microtask" | "immediate" = "immediate"
) {
  console.log("SENDNG NOTIF:", subbable._subscriptors.size, subbable);
  switch (priority) {
    case "immediate":
      subbable._subscriptors.forEach((cb) => {
        cb(target, subbable);
      });
      break;

    case "task":
      window.setTimeout(() => {
        subbable._subscriptors.forEach((cb) => {
          cb(target, subbable);
        });
      }, 0);
      break;

    case "microtask":
      ignorePromise(
        Promise.resolve().then(() => {
          subbable._subscriptors.forEach((cb) => {
            cb(target, subbable);
          });
        })
      );
      break;

    default:
      exhaustive(priority);
  }
}

export function exhaustive(x: never): never {
  throw new Error(`Exhaustive violation, unexpected value ${x}`);
}

// used alongside "@typescript-eslint/no-floating-promises" to explicitly
// necessitate ignoring promise results
export function ignorePromise<T>(promise: Promise<T>) {
  promise.catch((e) => {
    throw e;
  });
}

export function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
