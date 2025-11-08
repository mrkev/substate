import { useState } from "react";
import {
  useSubscribeToSubbableMutationHashable,
  usePrimitive,
} from "../../../linked-state/src/hooks";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { MutationHashable } from "../../../linked-state/src/MutationHashable";
import { Subbable } from "../../../linked-state/src/Subbable";
import { UtilityToggle } from "../UtilityToggle";
import { LinkedStateDebug } from "./LinkedStateDebug";

export function DebugContainer({ val }: { val: MutationHashable & Subbable }) {
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

export function DebugPrimitive({ val }: { val: LinkedPrimitive<unknown> }) {
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
