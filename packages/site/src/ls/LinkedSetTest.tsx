import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { useLink } from "../../../linked-state/src/hooks";
import { DynamicTest, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

export function LinkedSetTest({
  linkedSet,
  className,
}: {
  linkedSet: LinkedSet<number>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedSet Tester</h2>
      <pre className="text-start text-sm">
        <DebugOutSet set={linkedSet} pad={0} showUnknowns={false} />
      </pre>
    </div>
  );
}

const TAB_SIZE = 2;

function DebugOutSet({
  set: linkedSet,
  pad,
  path = "",
  showUnknowns,
}: {
  set: LinkedSet<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const set = useLink(linkedSet);
  const [input, setInput] = useState(0);

  const handleAdd = () => {
    set().add(input);
    setInput(input + 1);
  };

  const handleDelete = (value: number) => {
    set().delete(value);
  };

  const handleClear = () => {
    set().clear();
  };

  const result = [];

  let i = 0;
  for (const elem of set()) {
    const baseline = pad + TAB_SIZE;
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <DynamicTest
        key={`elem-${i}`}
        val={elem}
        pad={baseline}
        path={`${path}/${i}-s`}
        showUnknowns={showUnknowns}
      />,
      " ",
      <TxtButton
        title="shift"
        onClick={() => handleDelete(elem)}
        children="del."
      />
    );
    i++;
  }

  if (result.length > -1) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={set()} /> {"("}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      <TxtButton
        title="add"
        onClick={handleAdd}
        className="bg-transparent"
        children=" + "
      />
      <span className="text-gray-500">(len. {set().size})</span>
      {result}
      {")"}{" "}
      <TxtButton title="clear" onClick={handleClear}>
        clear
      </TxtButton>
    </>
  );
}
