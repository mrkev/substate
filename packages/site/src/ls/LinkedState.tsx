import { useState } from "react";
import { useSubscribeToSubbableMutationHashable } from "../../../linked-state/src/hooks";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { MutationHashable } from "../../../linked-state/src/MutationHashable";
import { Subbable } from "../../../linked-state/src/Subbable";
import { UtilityToggle } from "../UtilityToggle";
import { LinkedMapTest } from "./LinkedMapTest";
import { LinkedSetTest } from "./LinkedSetTest";
import { LinkedStateDebug } from "./LinkedStateDebug";

const linkedMap = LinkedMap.create<number, string>();
const linkedSet = LinkedSet.create<number>();

export function LinkedState() {
  return (
    <div className="flex flex-row">
      <Debug val={linkedMap}></Debug>
      <LinkedMapTest linkedMap={linkedMap} />
      <Debug val={linkedSet}></Debug>
      <LinkedSetTest linkedSet={linkedSet} />
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
