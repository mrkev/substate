import { WeakRefMap } from "./WeakRefMap";
import { SArray, Struct } from "./sstate";
import { replace } from "./sstate.serialization";
import { LinkedArray } from "./state/LinkedArray";
import { SPrimitive } from "./state/LinkedState";

export type KnowableObject = Struct<any> | SPrimitive<any> | SArray<any>;

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<KnowableObject>(10_000);
  history: LinkedArray<{ prevObjects: Map<string, string> }> =
    LinkedArray.create();

  constructor() {
    (window as any).globalState = this;
  }
}

export const globalState = new GlobalState();

export async function pushHistory(action: () => void | Promise<void>) {
  if (globalState.HISTORY_RECORDING) {
    return await action();
  }

  globalState.HISTORY_RECORDING = new Map();
  await action();
  const recorded = globalState.HISTORY_RECORDING;
  globalState.HISTORY_RECORDING = false;

  // Make sure it's after we stop recording! We don't want to record this history change!!
  if (recorded.size > 0) {
    globalState.history.push({ prevObjects: recorded });
  }
}

export function popHistory() {
  const { history, knownObjects } = globalState;
  const prev = history.pop();
  if (prev == null) {
    return;
  }

  for (const [id, serialized] of prev.prevObjects) {
    const object = knownObjects.get(id);

    if (object == null) {
      throw new Error(`no known object with ${id} found`);
    }

    if (object instanceof SPrimitive) {
      replace(serialized, object);
    }

    if (object instanceof SArray) {
      replace(serialized, object);
    }
  }
}
