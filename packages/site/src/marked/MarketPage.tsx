import { twMerge } from "tailwind-merge";
import { MarkedSet, useLink } from "../../../subbable-state/index";
import { useState } from "react";

const set = MarkedSet.create<number>();

export function MarkedStateTest() {
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
  markedSet: MarkedSet<number>;
  className?: string;
}) {
  const [next, setNext] = useState(0);
  const set = useLink(markedSet);
  function add() {
    set().add(next);
    setNext((prev) => prev + 1);
  }

  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>markedSet Tester</h2>
      <button onClick={add}>+</button>
      <pre className="text-start text-sm">
        {[...set()].map((x) => (
          <div key={x}>{x}</div>
        ))}

        {/* <DebugOutSet set={markedSet} pad={0} showUnknowns={false} /> */}
      </pre>
    </div>
  );
}
