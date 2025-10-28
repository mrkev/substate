import { useState } from "react";
import { useSubscribeToSubbableMutationHashable } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { MutationHashable } from "../../../linked-state/src/MutationHashable";
import { Subbable } from "../../../linked-state/src/Subbable";
import { UtilityToggle } from "../UtilityToggle";
import { LinkedArrayTest } from "./LinkedArrayTest";
import { LinkedMapTest } from "./LinkedMapTest";
import { LinkedSetTest } from "./LinkedSetTest";
import { LinkedStateDebug } from "./LinkedStateDebug";

const linkedMap = LinkedMap.create<number, string>();
const linkedSet = LinkedSet.create<number>();
const linkedArray = LinkedArray.create<number>();

// todo:
// LinkedArray
// LinkedPrimitive

export function LinkedState() {
  return (
    <div className="grid grid-cols-4">
      <Debug val={linkedMap}></Debug>
      <LinkedMapTest linkedMap={linkedMap} />
      <Debug val={linkedSet}></Debug>
      <LinkedSetTest linkedSet={linkedSet} />
      <Debug val={linkedArray}></Debug>
      <LinkedArrayTest linkedArray={linkedArray} />
    </div>
  );
}

function Debug({ val }: { val: MutationHashable & Subbable }) {
  useSubscribeToSubbableMutationHashable(val);
  const [tab, setTab] = useState<"struct" | "serialized">("struct");
  return (
    <div>
      <UtilityToggle
        toggled={tab === "struct"}
        onToggle={() => setTab("struct")}
      >
        struct
      </UtilityToggle>
      <UtilityToggle
        toggled={tab === "serialized"}
        onToggle={() => setTab("serialized")}
      >
        serialized
      </UtilityToggle>
      {tab === "struct" && <LinkedStateDebug val={val}></LinkedStateDebug>}
      {tab === "serialized" && (
        <div className="overflow-scroll text-start font-mono">
          Not available
          {/* <JSONView json={JSON.parse(serialize(project))} /> */}
        </div>
      )}
    </div>
  );
}
