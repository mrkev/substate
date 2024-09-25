import { useCallback, useMemo } from "react";
import {
  MutationHashable,
  useSubscribeToSubbableMutationHashable,
} from "./state/MutationHashable";
import { SubbableCallback } from "./state/Subbable";

class MutationFlag implements MutationHashable {
  public _subscriptors: Set<SubbableCallback> = new Set();
  public _hash: number = 0;
  private constructor() {}
  static create() {
    return new MutationFlag();
  }
  mutated() {
    MutationHashable.mutated(this, this);
  }
}

export type DirtyState = "clean" | "dirty" | "released";

export class DirtyObserver {
  private _cleanHash: number;
  private observing: WeakRef<MutationHashable>;
  public flag: MutationFlag;

  constructor(obj: MutationHashable, defaultState: "dirty" | "clean") {
    this.observing = new WeakRef(obj);
    this._cleanHash = defaultState === "clean" ? obj._hash : obj._hash - 1;
    this.flag = MutationFlag.create();
  }

  markClean(): void {
    const obj = this.observing.deref();
    if (obj == null) {
      console.warn("dirty observer is observing a dereferenced object");
      return;
    }
    this._cleanHash = obj._hash % Number.MAX_SAFE_INTEGER;
    this.flag.mutated();
  }

  dirtyState(): DirtyState {
    const obj = this.observing.deref();
    if (obj == null) {
      console.warn("dirty observer is observing a dereferenced object");
      return "released";
    }
    return this._cleanHash === obj._hash ? "clean" : "dirty";
  }
}

export function useDirtyTracker<S extends MutationHashable>(
  obj: S,
  defaultState: "dirty" | "clean" = "clean"
): [state: DirtyState, markClean: () => void] {
  const observer = useMemo(
    () => new DirtyObserver(obj, defaultState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obj]
  );
  useSubscribeToSubbableMutationHashable(obj, undefined, true);
  useSubscribeToSubbableMutationHashable(observer.flag, undefined, false);

  return [
    observer.dirtyState(),
    // interesting we need this useCallback
    useCallback(() => observer.markClean(), [observer]),
  ];
}
