import { useState } from "react";
import { lArray, lMap, lSet, lValue } from "../../../linked-state/index";
import { useLink } from "../../../linked-state/src/hooks";
import { LinkableArray } from "../../../linked-state/src/LinkableArray";
import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { DynamicTestArray } from "./LinkableArrayTest";
import { DynamicTestMap } from "./LinkableMapTest";
import { DebugOutBoolean } from "./LinkableValueTest";
import { Panel } from "../ui/Panel";
import { useRenderFlash } from "../ui/renderFlash";

const map = lMap<number, LinkableArray<number>>();
const set = lSet<number>();
const primitive = lValue(0);

const sharedBool = lValue(false);

const listState = lMap([
  ["buy milk", lValue(true)],
  ["buy eggs", lValue(false)],
  ["shared 1", sharedBool],
  ["shared 2", sharedBool],
]);

export function LinkableStateNested({ className }: { className?: string }) {
  const [key, setKey] = useState(0);
  const handleAdd = () => {
    map.set(key, lArray([2]));
    setKey(key + 1);
  };

  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <Panel title="LinkableMap<number, LinkableArray<number>>" className={className}>
        <pre className="text-sm">
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
      </Panel>
      <ListExample />
    </div>
  );
}

function ListExample() {
  const list = useLink(listState);
  const ref = useRenderFlash<HTMLElement>();

  return (
    <Panel ref={ref} title="todo list">
      <ListSummary />
      <ul className="mt-2 flex flex-col gap-1">
        {list()
          .entries()
          .map(([name, doneState], i) => (
            <ListItem key={i} name={name} doneState={doneState} />
          ))
          .toArray()}
      </ul>
    </Panel>
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
  const ref = useRenderFlash<HTMLSpanElement>();

  return (
    <span ref={ref} className="italic">
      Tasks done: {done.length}
    </span>
  );
}

function ListItem({
  name,
  doneState,
}: {
  name: string;
  doneState: LinkableValue<boolean>;
}) {
  const done = useLink(doneState);
  const ref = useRenderFlash<HTMLLIElement>();

  return (
    <li ref={ref} className="font-mono">
      {name}:{" "}
      {/* {done().get() ? (
        "done"
      ) : (
        <button onClick={() => doneState.set(true)}>mark done</button>
      )} */}
      <DebugOutBoolean prim={doneState} />
    </li>
  );
}
