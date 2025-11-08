import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { DebugContainer, DebugPrimitive } from "./Debug";
import { LinkedArrayTest } from "./LinkedArrayTest";
import { LinkedMapTest } from "./LinkedMapTest";
import { LinkedPrimitiveTester } from "./LinkedPrimitiveTest";
import { LinkedSetTest } from "./LinkedSetTest";

const map = LinkedMap.create<number, string>();
const set = LinkedSet.create<number>();
const array = LinkedArray.create<number>();
const primitive = LinkedPrimitive.of(0);

export function LinkedStateTest() {
  return (
    <div className="grid grid-cols-4">
      <DebugContainer val={map}></DebugContainer>
      <LinkedMapTest linkedMap={map} />
      <DebugContainer val={set}></DebugContainer>
      <LinkedSetTest linkedSet={set} />
      <div className="col-span-2">
        <h2>LinkedArray Tester</h2>
        <LinkedArrayTest linkedArray={array} />
      </div>
      <DebugPrimitive val={primitive}></DebugPrimitive>
      <LinkedPrimitiveTester linkedPrimitive={primitive} />
    </div>
  );
}
