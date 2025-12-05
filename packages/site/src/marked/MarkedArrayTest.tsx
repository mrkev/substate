import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { MarkedArray, useLink } from "@mrkev/marked-subbable";
import { MarkedCollection } from "./MarkedCollection";

const array = MarkedArray.create<number>();

export function MarkedArrayTest({ className }: { className?: string }) {
  const larr = useLink(array);
  const [input, setInput] = useState(0);

  function add() {
    larr().push(input);
    setInput((prev) => prev + 1);
  }

  function del(v: number) {
    larr().remove(v);
  }

  return (
    <div className={twMerge("overflow-scroll", className)}>
      <pre className="text-start text-sm">
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
    </div>
  );
}
