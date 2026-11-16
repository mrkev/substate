import { useState } from "react";
import { MarkedSet, useLink } from "@mrkev/marked-subbable";
import { MarkedArrayTest } from "./MarkedArrayTest";
import { DebugOutMarkedSet, DynamicTest } from "./MarkedSetTest";
import { Panel } from "../ui/Panel";
import { useRenderFlash } from "../ui/renderFlash";

export function MarkedStateTest() {
  const [set] = useState(() => {
    return MarkedSet.create<MarkedSet<number>>([MarkedSet.create<number>([0])]);
  });

  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <MarkedArrayTest />
      <MarkedSetTest markedSet={set} />
    </div>
  );
}

export function MarkedSetTest({
  markedSet,
  className,
}: {
  markedSet: MarkedSet<MarkedSet<number>>;
  className?: string;
}) {
  const [next, setNext] = useState(0);
  const set = useLink(markedSet);
  const ref = useRenderFlash<HTMLElement>();
  function add() {
    set().add(MarkedSet.create<number>([0]));
    setNext((prev) => prev + 1);
  }

  return (
    <Panel
      ref={ref}
      title="MarkedSet<MarkedSet<number>>"
      actions={<button onClick={add}>+</button>}
      className={className}
    >
      <pre className="text-sm">
        {[...set()].map((x, i) => (
          <div key={i}>{JSON.stringify([...x])}</div>
        ))}

        <DebugOutMarkedSet
          set={set()}
          pad={0}
          showUnknowns={false}
          handleAdd={add}
          handleDelete={(x) => set().delete(x)}
          renderValue={(
            value: MarkedSet<number>,
            key: string,
            pad: number,
            path: string,
            showUnknowns?: boolean,
          ) => (
            <DynamicTest
              key={key}
              val={value}
              pad={pad}
              path={path}
              showUnknowns={showUnknowns}
            />
          )}
        />

        {/* <DebugOutSet set={markedSet} pad={0} showUnknowns={false} /> */}
      </pre>
    </Panel>
  );
}
