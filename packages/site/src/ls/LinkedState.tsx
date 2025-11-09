import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { LinkedArrayTest } from "./LinkedArrayTest";
import { LinkedMapTest } from "./LinkedMapTest";
import { LinkedPrimitiveTester } from "./LinkedPrimitiveTest";
import { LinkedSetTest } from "./LinkedSetTest";

const map = LinkedMap.create<number, string>();
const set = LinkedSet.create<number>();
const array = LinkedArray.create<number>();
const primitive = LinkedPrimitive.create(0);

export function LinkedStateTest() {
  return (
    <div className="grid grid-cols-4 gap-2">
      <LinkedMapTest
        className="col-span-2 rounded-sm bg-gray-700/10 p-4"
        map={map}
      />
      <LinkedSetTest
        className="col-span-2 rounded-sm bg-gray-700/10 p-4"
        linkedSet={set}
      />
      <LinkedArrayTest
        className="col-span-2 rounded-sm bg-gray-700/10 p-4"
        linkedArray={array}
      />
      <LinkedPrimitiveTester
        className="col-span-2 rounded-sm bg-gray-700/10 p-4"
        linkedPrimitive={primitive}
      />
    </div>
  );
}
