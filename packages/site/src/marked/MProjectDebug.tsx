import { useState } from "react";
import { DebugTree } from "@mrkev/marked-subbable";
import { UtilityToggle } from "../UtilityToggle";
import { MProject } from "./MProject";
import { JSONView } from "../JSONView";
import { simplifyAndPackage } from "@mrkev/marked-serializable";
import { Panel } from "../ui/Panel";

export function MProjectDebug({ project }: { project: MProject }) {
  const [tab, setTab] = useState<"struct" | "serialized">("struct");
  return (
    <Panel
      title="state"
      className="flex-1"
      actions={
        <>
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
        </>
      }
    >
      {tab === "struct" && <DebugTree val={project}></DebugTree>}
      {tab === "serialized" && (
        <div className="font-mono text-left overflow-scroll">
          <JSONView
            defaultExpandedLevels={2}
            json={JSON.parse(JSON.stringify(simplifyAndPackage(project)))}
          />
        </div>
      )}
    </Panel>
  );
}
