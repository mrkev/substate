import { nanoid } from "nanoid";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { Structured } from "./Structured";
import { WeakRefMap } from "./WeakRefMap";
import { exhaustive } from "./assertions";
import { LinkedArray } from "./lib/state/LinkedArray";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { SArray, SSchemaArray } from "./sstate";
import { replace, serialize } from "./serialization";
import { StructuredKinds } from "./StructuredKinds";
import { SSet } from ".";

export type KnowableObject = StructuredKinds;

export function isKnowable(val: unknown) {
  return (
    val instanceof LinkedPrimitive ||
    val instanceof Struct ||
    val instanceof Struct2 ||
    val instanceof Structured ||
    val instanceof SArray ||
    val instanceof SSchemaArray
  );
}

export type HistoryEntry = {
  id: string; // history entry id
  objects: Map<string, string>; // id => serialized obj
  // constructors: Map<string, any>; // id => struct constructors
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

const _global = { state: null as any };
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

function actAfter(cb: () => void | Promise<void>, after: () => void) {
  const maybePromise = cb();
  if (maybePromise == null) {
    return after();
  } else {
    return maybePromise.then(() => after());
  }
}

export function pushHistory(objs: KnowableObject[]) {
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
  globalState.history.push({ objects: entries, id });

  if (globalState.redoStack.length > 0) {
    globalState.redoStack.splice(0, globalState.redoStack.length);
  }
}

export function recordHistory(action: () => void): void;
export function recordHistory(action: () => Promise<void>): Promise<void>;
export function recordHistory(
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

    if (recorded === false) {
      throw new Error("recorded === false, shouldn't happen");
    }

    // Make sure it's after we stop recording! We don't want to record this history change!!
    if (recorded.size > 0) {
      globalState.history.push({ objects: recorded, id: `h-${nanoid(4)}` });
    }

    if (globalState.redoStack.length > 0) {
      globalState.redoStack.splice(0, globalState.redoStack.length);
    }
  });
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

  // In reverse, to go back in time
  for (const [id, serialized] of [...prev.objects.entries()].reverse()) {
    const object = knownObjects.get(id);

    if (object == null) {
      throw new Error(`no known object with ${id} found`);
    }

    try {
      const json = JSON.parse(serialized);
      if (object instanceof LinkedPrimitive) {
        replace(json, object);
      } else if (object instanceof SArray) {
        replace(json, object);
      } else if (object instanceof SSchemaArray) {
        replace(json, object);
      } else if (object instanceof Struct) {
        replace(json, object);
      } else if (object instanceof Struct2) {
        replace(json, object);
      } else if (object instanceof Structured) {
        replace(json, object);
      } else if (object instanceof SSet) {
        throw new Error("REPLACE SET NOT IMPLEMENTED");
      } else {
        exhaustive(object);
      }
    } catch (e) {
      console.log("error with replace (probably parsing):", serialized);
      throw e;
    }
  }
}

export function forwardHistory() {
  const globalState = getGlobalState();
  const { history, knownObjects, redoStack } = globalState;
  const next = redoStack.pop();
  if (next == null) {
    return;
  }

  // saveContraryUndo(prev);

  // // In reverse, to go back in time
  // for (const [id, serialized] of [...prev.objects.entries()].reverse()) {
  //   const object = knownObjects.get(id);

  //   if (object == null) {
  //     throw new Error(`no known object with ${id} found`);
  //   }

  //   try {
  //     const json = JSON.parse(serialized);
  //     if (object instanceof LinkedPrimitive) {
  //       replace(json, object);
  //     } else if (object instanceof SArray) {
  //       replace(json, object);
  //     } else if (object instanceof SSchemaArray) {
  //       replace(json, object);
  //     } else if (object instanceof Struct) {
  //       replace(json, object);
  //     } else if (object instanceof Struct2) {
  //       replace(json, object);
  //     } else if (object instanceof Structured) {
  //       replace(json, object);
  //     } else {
  //       exhaustive(object);
  //     }
  //   } catch (e) {
  //     console.log("error with replace (probably parsing):", serialized);
  //     throw e;
  //   }
  // }
}

export const history = {
  push: pushHistory,
  record: recordHistory,
  //
  pop: popHistory,
  redo: forwardHistory,
};
