import { nanoid } from "nanoid";
import { WeakRefMap } from "./WeakRefMap";
import { SArray, SSchemaArray, Struct } from "./sstate";
import { replace, serialize } from "./sstate.serialization";
import { LinkedArray } from "./lib/state/LinkedArray";
import { SPrimitive } from "./lib/state/LinkedState";
import { exhaustive } from "./lib/state/Subbable";

export type KnowableObject =
  | Struct<any>
  | SPrimitive<any>
  | SArray<any>
  | SSchemaArray<any>;

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<KnowableObject>(10_000);
  readonly history = LinkedArray.create<{
    id: string;
    prevObjects: Map<string, string>;
  }>();

  readonly redoStack = LinkedArray.create<{
    prevObjects: Map<string, string>;
  }>(); // TODO

  constructor() {
    (window as any).globalState = this;
  }
}

let _global = { state: null as any };
export function getGlobalState(): GlobalState {
  if (_global.state == null) {
    _global.state = new GlobalState();
  }
  return _global.state;
}

export function saveForHistory(obj: KnowableObject) {
  const globalState = getGlobalState();
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
  const globalState = getGlobalState();
  if (globalState.HISTORY_RECORDING) {
    return await action();
  }

  globalState.HISTORY_RECORDING = new Map();
  await action();
  const recorded = globalState.HISTORY_RECORDING;
  globalState.HISTORY_RECORDING = false;

  // Make sure it's after we stop recording! We don't want to record this history change!!
  if (recorded.size > 0) {
    globalState.history.push({ prevObjects: recorded, id: `h-${nanoid(4)}` });
  }
}

export function popHistory() {
  const globalState = getGlobalState();
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
    } else if (object instanceof SArray) {
      replace(serialized, object);
    } else if (object instanceof SSchemaArray) {
      replace(serialized, object);
    } else if (object instanceof Struct) {
      replace(serialized, object);
    } else {
      exhaustive(object);
    }
  }
}
