import { WeakRefMap } from "./WeakRefMap";
import { SArray, Struct } from "./sstate";
import { replace, serialize } from "./sstate.serialization";
import { LinkedArray } from "./lib/state/LinkedArray";
import { SPrimitive } from "./lib/state/LinkedState";

export type KnowableObject = Struct<any> | SPrimitive<any> | SArray<any>;

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<KnowableObject>(10_000);
  readonly history = LinkedArray.create<{
    prevObjects: Map<string, string>;
  }>();
  readonly redoStack = LinkedArray.create<{
    prevObjects: Map<string, string>;
  }>(); // TODO

  constructor() {
    (window as any).globalState = this;
  }
}

export const globalState = new GlobalState();

export function saveForHistory(obj: KnowableObject) {
  if (
    globalState.HISTORY_RECORDING == false ||
    // save object on first call only.
    // We might make multiple operations on this data structure but we only
    // want the "original"
    globalState.HISTORY_RECORDING.get(obj._id) != null
  ) {
    return;
  }
  const serialized = serialize(obj);
  globalState.HISTORY_RECORDING.set(obj._id, serialized);
}

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

    if (object instanceof Struct) {
      replace(serialized, object);
    }
  }
}
