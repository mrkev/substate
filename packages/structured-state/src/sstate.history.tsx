import { nanoid } from "nanoid";
import { nullthrows, setWindow } from "./lib/nullthrows";
import { replacePackage } from "./serialization/replace";
import { serialize, Simplified } from "./serialization/serialization";
import { LinkedArray } from "./state/LinkedArray";
import { StructuredKind } from "./StructuredKinds";
import { WeakRefMap } from "./WeakRefMap";

// todo: use this for faster performance with array history
export type ObjectSnapshot =
  | {
      kind: Exclude<Simplified["$$"], "arr-schema">;
      id: string;
      snapshot: string;
    }
  // only store the ids. encodes ids and order:
  // - objects that went on to be added, no problem. future has more info than past, just delete it
  // - objects that went on to be removed, we store in a map as they existed at removal time
  // - oreder is encoded in array itself
  | {
      kind: "arr-schema";
      id: string;
      descriptor: string[];
      removedObjs: Map<string, string>;
    };

export type HistorySnapshot = {
  id: string;
  name: string;
  objects: Map<string, string>; // id => serialized obj
  // constructors: Map<string, any>; // id => struct constructors
};

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<StructuredKind>(10_000);
  readonly history = new LinkedArray<HistorySnapshot>([], "$$history", true);
  readonly redoStack = new LinkedArray<HistorySnapshot>([], "$$redo", true);
  constructor() {
    setWindow("globalState", this);
  }
}

const _global = { state: null as any };
export function getGlobalState(): GlobalState {
  if (_global.state == null) {
    _global.state = new GlobalState();
  }
  return _global.state;
}

/**
 * 1. saves the state of this object to history
 * 2. only saves the state of the first time it was called, per "history record session"
 */
export function saveForHistory(obj: StructuredKind) {
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

/** runs cb(), runs after() after cb() */
function actAfter(
  cb: () => void | Promise<void>,
  after: () => void
): void | Promise<void> {
  const maybePromise = cb();
  if (maybePromise == null) {
    return after();
  } else {
    return maybePromise.then(() => after());
  }
}

export function pushHistory(name: string, objs: StructuredKind[]) {
  if (objs.length < 1) {
    console.warn(".pushHistory called with empty array");
    return;
  }

  const globalState = getGlobalState();
  // if already recording, just run and return
  if (globalState.HISTORY_RECORDING) {
    // todo; good failsafe to have?
    throw new Error("Won't pushHistory when history is being recorded");
  }

  const entries = new Map();
  for (const obj of objs) {
    const serialized = serialize(obj);
    entries.set(obj._id, serialized);
  }

  const id = `h-${nanoid(4)}`;
  globalState.history.push({ objects: entries, id, name });

  if (globalState.redoStack.length > 0) {
    globalState.redoStack.splice(0, globalState.redoStack.length);
  }
}

/**
 * TO MAKE ASYNC:
 * - save/push/record history add to task queue:
 * - record history pushes to task queue:
 *   - task is serialization, action
 * - funcs can be awaited to promise of task completion
 */

export function recordHistory(name: string, action: () => void): void;
export function recordHistory(
  name: string,
  action: () => Promise<void>
): Promise<void>;
export function recordHistory(
  name: string,
  action: () => void | Promise<void>
): void | Promise<void> {
  const globalState = getGlobalState();

  // if already recording, just run and return
  if (globalState.HISTORY_RECORDING) {
    return action();
  }

  globalState.HISTORY_RECORDING = new Map();

  return actAfter(action, function pushHistoryEnd() {
    const recorded = globalState.HISTORY_RECORDING;
    globalState.HISTORY_RECORDING = false;
    // console.log("recorded", recorded);

    if (recorded === false) {
      throw new Error("recorded === false, shouldn't happen");
    }

    // Make sure it's after we stop recording! We don't want to record this history change!!
    if (recorded.size > 0) {
      globalState.history.push({
        objects: recorded,
        id: `h-${nanoid(4)}`,
        name,
      });
    }

    if (globalState.redoStack.length > 0) {
      globalState.redoStack.splice(0, globalState.redoStack.length);
    }
  });
}

function historyEntryOfObjectsEntryModifies(
  entry: HistorySnapshot,
  globalState: GlobalState
) {
  const newEntry: HistorySnapshot = {
    id: `h-${nanoid(4)}`,
    objects: new Map<string, string>(),
    name: entry.name,
  };

  for (const [id] of entry.objects) {
    // get current state of object to save
    const object = nullthrows(
      globalState.knownObjects.get(id),
      `no known object with ${id} found`
    );
    newEntry.objects.set(id, serialize(object));
  }

  return newEntry;
}

function popHistory() {
  const globalState = getGlobalState();
  const prevState = globalState.history.pop();
  if (prevState == null) {
    return;
  }

  const redo = historyEntryOfObjectsEntryModifies(prevState, globalState);
  globalState.redoStack.push(redo);

  // In reverse, to go back in time
  // todo: are maps acutally ordered by insertion time?
  for (const [id, serialized] of [...prevState.objects.entries()].reverse()) {
    const object = nullthrows(
      globalState.knownObjects.get(id),
      `no known object with ${id} found`
    );

    const json = JSON.parse(serialized);
    // console.log("replacing", object, "with", json);
    replacePackage(json, object);
  }
}

export function forwardHistory() {
  const globalState = getGlobalState();
  const next = globalState.redoStack.pop();
  if (next == null) {
    return;
  }

  const redo = historyEntryOfObjectsEntryModifies(next, globalState);
  globalState.history.push(redo);

  // In reverse, to go back in time. TODO: necessary?
  for (const [id, serialized] of [...next.objects.entries()].reverse()) {
    const object = nullthrows(
      globalState.knownObjects.get(id),
      `no known object with ${id} found`
    );

    const json = JSON.parse(serialized);
    // console.log("replacing", object, "with", json);
    replacePackage(json, object);
  }
}

export const history = {
  push: pushHistory,
  record: recordHistory,
  //
  undo: popHistory,
  redo: forwardHistory,
};
