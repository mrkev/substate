import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { LinkedArrayTest } from "./LinkedArrayTest";
import { LinkedMapTest } from "./LinkedMapTest";
import { LinkedSetTest } from "./LinkedSetTest";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedPrimitiveTester } from "./LinkedPrimitiveTest";
import { DebugContainer, DebugPrimitive } from "./Debug";

const linkedMap = LinkedMap.create<number, string>();
const linkedSet = LinkedSet.create<number>();
const linkedArray = LinkedArray.create<number>();
const linkedPrimitive = LinkedPrimitive.of(0);

export function LinkedStateTest() {
  return (
    <div className="grid grid-cols-4">
      <DebugContainer val={linkedMap}></DebugContainer>
      <LinkedMapTest linkedMap={linkedMap} />
      <DebugContainer val={linkedSet}></DebugContainer>
      <LinkedSetTest linkedSet={linkedSet} />
      {/*  */}

      <DebugContainer val={linkedArray}></DebugContainer>
      <div>
        <h2>LinkedArray Tester</h2>
        <LinkedArrayTest linkedArray={linkedArray} />
      </div>
      <DebugPrimitive val={linkedPrimitive}></DebugPrimitive>
      <LinkedPrimitiveTester linkedPrimitive={linkedPrimitive} />
    </div>
  );
}
