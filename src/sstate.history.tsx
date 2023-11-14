import { nanoid } from "nanoid";
import { WeakRefMap } from "./WeakRefMap";
import { SArray, SSchemaArray, Struct } from "./sstate";
import { replace, serialize } from "./sstate.serialization";
import { LinkedArray } from "./lib/state/LinkedArray";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { exhaustive } from "./assertions";

export type KnowableObject =
  | Struct<any>
  | LinkedPrimitive<any>
  | SArray<any>
  | SSchemaArray<any>;

export type HistoryEntry = {
  id: string;
  objects: Map<string, string>;
};

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<KnowableObject>(10_000);
  readonly history = LinkedArray.create<HistoryEntry>();
  readonly redoStack = LinkedArray.create<HistoryEntry>(); // TODO

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
    globalState.history.push({ objects: recorded, id: `h-${nanoid(4)}` });
  }

  if (globalState.redoStack.length > 0) {
    globalState.redoStack.splice(0, globalState.redoStack.length);
  }
}

function saveContraryRedo(undo: HistoryEntry) {
  const globalState = getGlobalState();
  const redo = {
    id: `h-${nanoid(4)}`,
    objects: new Map<string, string>(),
  };

  for (const [id] of undo.objects) {
    const object = globalState.knownObjects.get(id);

    if (object == null) {
      throw new Error(`no known object with ${id} found`);
    }

    redo.objects.set(id, serialize(object));
  }

  globalState.redoStack.push(redo);
}

export function popHistory() {
  const globalState = getGlobalState();
  const { history, knownObjects } = globalState;
  const prev = history.pop();
  if (prev == null) {
    return;
  }

  saveContraryRedo(prev);

  for (const [id, serialized] of prev.objects) {
    const object = knownObjects.get(id);

    if (object == null) {
      throw new Error(`no known object with ${id} found`);
    }

    if (object instanceof LinkedPrimitive) {
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
