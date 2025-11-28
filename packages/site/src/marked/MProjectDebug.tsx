import { useState } from "react";
import { DebugTree } from "../../../subbable-state/index";
import { UtilityToggle } from "../UtilityToggle";
import { MProject } from "./MProject";

export function MProjectDebug({ project }: { project: MProject }) {
  const [tab, setTab] = useState<"struct" | "serialized">("struct");
  return (
    <div style={{ flex: "1 1 1px" }}>
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
      {tab === "struct" && <DebugTree val={project}></DebugTree>}
      {tab === "serialized" && (
        <div
          style={{
            overflow: "scroll",
            textAlign: "left",
            fontFamily: "monospace",
          }}
        >
          not implemented
          {/* <JSONView json={JSON.parse(serialize(project))} /> */}
        </div>
      )}
    </div>
  );
}
