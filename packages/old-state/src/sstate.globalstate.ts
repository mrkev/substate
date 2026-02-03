import { setWindow } from "./lib/nullthrows";
import { HistorySnapshot, ObjectSnapshot } from "./sstate.history";
import { LinkedArray } from "./state/LinkedArray";
import { StructuredKind } from "./StructuredKinds";
import { WeakRefMap } from "./WeakRefMap";

export class GlobalState {
  HISTORY_RECORDING: Map<string, ObjectSnapshot> | false = false;
  readonly knownObjects = new WeakRefMap<StructuredKind>(10000);
  readonly history = LinkedArray.create<HistorySnapshot>();
  readonly redoStack = LinkedArray.create<HistorySnapshot>();
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
