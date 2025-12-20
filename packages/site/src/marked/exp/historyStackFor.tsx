import {
  constructSimplifiedPackage,
  isPrimitive,
  isSimplifiable,
  MarkedSerializable,
  SerializationIndex,
  SerializationMark,
  SimplifiedPackage,
  simplifyAndPackage,
} from "@mrkev/marked-serializable";
import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
  printId,
  subbable,
  SubbableMark,
} from "@mrkev/marked-subbable";
import { WeakRefMap } from "../../../../structured-state/src/WeakRefMap";

// class HistoryMark {
//   public readonly _id: string; // different id for history?

//   public register<T>(
//     contained?: (readonly T[] | null) | Iterable<T> | null | undefined
//   ) {

//   }
// }

export interface MarkedHistoric {
  // We want MarkedHistorics to also be MarkedSubbables since we need the $$id in the mark
  // We use the id for packaging, where we serialize nodes as refs, to serialize non-tree graphs
  readonly $$mark: SubbableMark;
  readonly $$serialization: SerializationMark<any, any>;

  // readonly $$history;
}

type StackEntry = {
  name: string;
  changeset: SimplifiedPackage[];
};

class HistoryStack {
  private readonly unsubscribe: () => void;
  private readonly stack: StackEntry[] = [];
  private readonly knownObjects = new WeakRefMap<
    | MarkedHistoric
    | MarkedArray<any>
    | MarkedMap<any, any>
    | MarkedSet<any>
    | MarkedValue<any>
  >(10_000);

  private ignoreChanges = false;

  // current changes
  private changeset: SimplifiedPackage[] = [];

  constructor(
    observed: MarkedHistoric,
    private readonly serializationIndex: SerializationIndex
  ) {
    // record the observed "root" object
    this.knownObjects.set(observed.$$mark._id, observed);
    const start = simplifyAndPackage(observed);
    this.changeset.push(start);

    // record changes to children
    this.unsubscribe = subbable.subscribe(observed, (target) => {
      if (this.ignoreChanges) {
        return;
      }

      if (isSimplifiable(target)) {
        const existing = this.knownObjects.get(target.$$mark._id);
        if (existing == null) {
          this.knownObjects.set(target.$$mark._id, target);
          console.log("recorded known object", printId(target));
        }
        const change = simplifyAndPackage(target);
        this.changeset.push(change);
      } else {
        console.warn(
          "can't record history of non-simplifiable target!",
          target
        );
      }
    });
  }

  checkpoint(name: string) {
    this.stack.push({ name, changeset: this.changeset });
    this.changeset = [];
  }

  pop() {
    const revert = this.stack.pop();
    if (revert == null) {
      return;
    }
    try {
      // we'll be editing the subbables, ignore these changes
      this.ignoreChanges = true;
      // iterate through changes in reverse chronological (push) order
      let change;
      while ((change = revert.changeset.pop())) {
        if (isPrimitive(change.root)) {
          throw new Error("primitive serialized at root in history?");
        }

        console.log("would revert", change);
        const obj = this.knownObjects.get(change.root._id);
        const constructed = constructSimplifiedPackage(
          change,
          this.serializationIndex
        );

        console.log("we want to alter", obj, "and make it", constructed);

        // FIND object to modify
        // if MarkedValue, replace
        // if serializable, call replace?
        // if MarkedArray
        // if MarkedMap
        // if MarkedSet
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.ignoreChanges = false;
    }
  }

  destroy() {
    this.unsubscribe();
  }
}

export function historyStackFor(
  m: MarkedSubbable & MarkedSerializable<any>,
  serializationIndex: SerializationIndex
) {
  const history = new HistoryStack(m, serializationIndex);
  return history;
}
