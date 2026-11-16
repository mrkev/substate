import { useState } from "react";
import { MarkedArray, useLink } from "@mrkev/marked-subbable";
import { MarkedCollection } from "./MarkedCollection";
import { Panel } from "../ui/Panel";
import { useRenderFlash } from "../ui/renderFlash";

const array = MarkedArray.create<number>();

export function MarkedArrayTest({ className }: { className?: string }) {
  const larr = useLink(array);
  const [input, setInput] = useState(0);
  const ref = useRenderFlash<HTMLElement>();

  function add() {
    larr().push(input);
    setInput((prev) => prev + 1);
  }

  function del(v: number) {
    larr().remove(v);
  }

  return (
    <Panel ref={ref} title="MarkedArray" className={className}>
      <pre className="text-sm">
        <MarkedCollection
          delimiters={["[", "]"]}
          set={larr()}
          pad={0}
          showUnknowns={false}
          handleAdd={add}
          handleDelete={del}
          renderValue={(v: number, pad: number, showUnknowns?: boolean) => {
            return `${v}`;
          }}
        />
      </pre>
    </Panel>
  );
}
