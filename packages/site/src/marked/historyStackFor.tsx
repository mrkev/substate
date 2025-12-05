import {
  SimplifiedPackage,
  MarkedSerializable,
  simplifyAndPackage,
  isSerializable,
} from "@mrkev/marked-serializable";
import {
  MarkedSubbable,
  subbable,
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/subbable-state";

type StackEntry = {
  name: string;
  changeset: SimplifiedPackage[];
};

class HistoryStack {
  private readonly unsubscribe: () => void;
  private readonly stack: StackEntry[] = [];

  // current changes
  private changeset: SimplifiedPackage[] = [];

  constructor(observed: MarkedSubbable & MarkedSerializable<any>) {
    const start = simplifyAndPackage(observed);
    this.changeset.push(start);

    this.unsubscribe = subbable.subscribe(observed, (target) => {
      if (
        isSerializable(target) ||
        target instanceof MarkedArray ||
        target instanceof MarkedMap ||
        target instanceof MarkedSet ||
        target instanceof MarkedValue
      ) {
        this.changeset.push(simplifyAndPackage(observed));
      } else {
        console.warn(
          "can't record history of non-serializable target!",
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
    let change;
    while ((change = revert.changeset.pop())) {
      console.log("would revert", change);
    }
  }

  destroy() {
    this.unsubscribe();
  }
}
export function historyStackFor(m: MarkedSubbable & MarkedSerializable<any>) {
  const history = new HistoryStack(m);
  return history;
}
