import { LinkableArray } from "../../../linked-state/src/LinkableArray";
import { LinkableMap } from "../../../linked-state/src/LinkableMap";
import { LinkableSet } from "../../../linked-state/src/LinkableSet";
import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { LinkableArrayTest } from "./LinkableArrayTest";
import { LinkableMapTest } from "./LinkableMapTest";
import { LinkablePrimitiveTest } from "./LinkablePrimitiveTest";
import { LinkableSetTest } from "./LinkableSetTest";

const map = LinkableMap.create<number, string>();
const set = LinkableSet.create<number>();
const array = LinkableArray.create<number>();
const primitive = LinkableValue.create(0);

export function LinkableStateTest() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <LinkableMapTest className="rounded-sm bg-gray-700/10 p-4" map={map} />
      <LinkableSetTest
        className="rounded-sm bg-gray-700/10 p-4"
        linkedSet={set}
      />
      <LinkableArrayTest
        className="rounded-sm bg-gray-700/10 p-4"
        linkedArray={array}
      />
      <LinkablePrimitiveTest
        className="rounded-sm bg-gray-700/10 p-4"
        prim={primitive}
      />
    </div>
  );
}
