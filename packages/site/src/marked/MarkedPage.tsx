import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { MarkedSet, useLink } from "../../../subbable-state/index";
import { MarkedArrayTest } from "./MarkedArrayTest";
import { DebugOutMarkedSet, DynamicTest } from "./MarkedSetTest";

export function MarkedStateTest() {
  const [set] = useState(() => {
    return MarkedSet.create<MarkedSet<number>>([MarkedSet.create<number>([0])]);
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <MarkedSetTest
        className="rounded-sm bg-gray-700/10 p-4"
        markedSet={set}
      />
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
  function add() {
    set().add(MarkedSet.create<number>([0]));
    setNext((prev) => prev + 1);
  }

  return (
    <>
      <MarkedArrayTest />
      <div className={twMerge("overflow-scroll", className)}>
        <h2>markedSet Tester</h2>
        <button onClick={add}>+</button>
        <pre className="text-start text-sm">
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
              showUnknowns?: boolean
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
      </div>
    </>
  );
}
