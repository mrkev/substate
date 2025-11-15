import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { lArray, lMap, lSet, lValue } from "../../../linked-state/index";
import { useLink } from "../../../linked-state/src/hooks";
import { LinkableArray } from "../../../linked-state/src/LinkableArray";
import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { DynamicTestArray } from "./LinkableArrayTest";
import { DynamicTestMap } from "./LinkableMapTest";

const map = lMap<number, LinkableArray<number>>();
const set = lSet<number>();
const primitive = lValue(0);

const listState = lMap([
  ["buy milk", lValue(true)],
  ["buy eggs", lValue(false)],
]);

export function LinkableStateNested({ className }: { className?: string }) {
  const [key, setKey] = useState(0);
  const handleAdd = () => {
    map.set(key, lArray([2]));
    setKey(key + 1);
  };

  return (
    <>
      <div className={twMerge("overflow-scroll", className)}>
        <h2>LinkedState Tester</h2>
        <pre className="text-start text-sm">
          <DynamicTestMap
            map={map}
            pad={0}
            showUnknowns={true}
            onAdd={handleAdd}
            renderValue={(val, key, pad, path, showUnknowns) => (
              <DynamicTestArray
                arr={val}
                key={key}
                pad={pad + 2}
                path={`${path}/s${key}`}
                showUnknowns={showUnknowns}
              />
            )}
          />
        </pre>
      </div>
      <ListExample />
    </>
  );
}

function ListExample() {
  const list = useLink(listState);

  return (
    <>
      <ListSummary />
      <ul>
        {list()
          .entries()
          .map(([name, doneState], i) => (
            <ListItem key={i} name={name} doneState={doneState} />
          ))
          .toArray()}
      </ul>
    </>
  );
}

function ListSummary() {
  // second argument: listen to recursive changes.
  // ie, this component will re-render when the done
  // state for list items changes
  const todoList = useLink(listState, true);

  const done = todoList()
    .entries()
    .filter(([listItem, done]) => {
      return done.get() == true;
    })
    .toArray();

  return <i>Tasks done: {done.length}</i>;
}

function ListItem({
  name,
  doneState,
}: {
  name: string;
  doneState: LinkableValue<boolean>;
}) {
  const done = useLink(doneState);

  return (
    <li>
      {name}:{" "}
      {done().get() ? (
        "done"
      ) : (
        <button onClick={() => doneState.set(true)}>mark done</button>
      )}
    </li>
  );
}
