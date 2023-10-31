import { Struct } from "./sstate";
import { construct } from "./sstate.serialization";
import { SPrimitive } from "./state/LinkedState";

type KnowableObject = Struct<any> | SPrimitive<any>;

class WeakRefMap<T extends WeakKey> {
  private readonly map: Map<string, WeakRef<T>> = new Map();
  private readonly cleanFactor: number = 100; // TODO: make 100000, larger
  private actionCounter = 0;

  private _clean() {
    console.log("WeakRefMap: cleaning...");
    for (const [key, value] of this.map.entries()) {
      if (value.deref() == null) {
        this.map.delete(key);
      }
    }
  }

  set(id: string, value: T) {
    this.map.set(id, new WeakRef(value));
    this.actionCounter++;
    if (this.actionCounter > this.cleanFactor) {
      this._clean();
      this.actionCounter = 0;
    }
  }

  get(id: string): T | null {
    return this.map.get(id)?.deref() ?? null;
  }

  print() {
    for (const [key, value] of this.map.entries()) {
      console.log(key, value.deref() ?? null);
    }
  }
}

class GlobalState {
  HISTORY_RECORDING: Map<string, string> | false = false;
  readonly knownObjects = new WeakRefMap<KnowableObject>();
  history: Array<{ prevObjects: Map<string, string> }> = [];
}

export const globalState = new GlobalState();
(window as any).globalState = globalState;

export async function pushHistory(
  obj: KnowableObject,
  action: () => Promise<void>
) {
  if (globalState.HISTORY_RECORDING) {
    return await action();
  }

  globalState.HISTORY_RECORDING = new Map();
  await action();
  // for (const [key, value] of globalState.RECORDING.entries()) {
  // }
  globalState.history.push({ prevObjects: globalState.HISTORY_RECORDING });
  globalState.HISTORY_RECORDING = false;
  console.log("GLBOAL", globalState);
}

export function popHistory(serialized: string) {
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

    const constructed = construct(serialized, object.constructor);

    if (object instanceof SPrimitive) {
      assertSPrimitive(constructed);
      object.replace(object.get());
    }
  }
  // const prevState = construct(serialized, state.constructor);
}

function assertSPrimitive<T>(value: unknown): asserts value is SPrimitive<any> {
  if (!(value instanceof SPrimitive)) {
    throw new Error("not an sprimitive"); // assertion error
  }
}
