import { useState } from "react";
import {
  usePrimitive,
  useSubscribeToSubbableMutationHashable,
} from "../../../linked-state/src/hooks";
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
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedPrimitiveTester } from "./LinkedPrimitiveTest";

const linkedMap = LinkedMap.create<number, string>();
const linkedSet = LinkedSet.create<number>();
const linkedArray = LinkedArray.create<number>();
const linkedPrimitive = LinkedPrimitive.of(0);

export function LinkedState() {
  return (
    <div className="grid grid-cols-4">
      <DebugContainer val={linkedMap}></DebugContainer>
      <LinkedMapTest linkedMap={linkedMap} />
      <DebugContainer val={linkedSet}></DebugContainer>
      <LinkedSetTest linkedSet={linkedSet} />
      <DebugContainer val={linkedArray}></DebugContainer>
      <LinkedArrayTest linkedArray={linkedArray} />
      <DebugPrimitive val={linkedPrimitive}></DebugPrimitive>
      <LinkedPrimitiveTester linkedPrimitive={linkedPrimitive} />
    </div>
  );
}

function DebugContainer({ val }: { val: MutationHashable & Subbable }) {
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

function DebugPrimitive({ val }: { val: LinkedPrimitive<unknown> }) {
  usePrimitive(val);
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
