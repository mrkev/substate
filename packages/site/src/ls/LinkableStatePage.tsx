import { LinkableArray } from "../../../linked-state/src/LinkableArray";
import { LinkableMap } from "../../../linked-state/src/LinkableMap";
import { LinkableSet } from "../../../linked-state/src/LinkableSet";
import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { LinkableArrayTest } from "./LinkableArrayTest";
import { LinkableMapTest } from "./LinkableMapTest";
import { LinkableValueTest } from "./LinkableValueTest";
import { LinkableSetTest } from "./LinkableSetTest";

const map = LinkableMap.create<number, string>();
const set = LinkableSet.create<number>();
const array = LinkableArray.create<number>();
const primitive = LinkableValue.create(0);

export function LinkableStateTest() {
  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <LinkableMapTest map={map} />
      <LinkableSetTest linkedSet={set} />
      <LinkableArrayTest linkedArray={array} />
      <LinkableValueTest prim={primitive} />
    </div>
  );
}
