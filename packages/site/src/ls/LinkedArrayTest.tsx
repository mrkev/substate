import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useLink } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { DebugOutReact, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

const TAB_SIZE = 2;

export function LinkedArrayTest({
  linkedArray,
  className,
}: {
  linkedArray: LinkedArray<number>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedArray Tester</h2>
      <pre className="text-start text-sm">
        <DebugOutArray arr={linkedArray} pad={0} showUnknowns={true} />
      </pre>
    </div>
  );
}

function DebugOutArray({
  arr: linkedArray,
  pad,
  path = "",
  showUnknowns,
}: {
  arr: LinkedArray<number>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const arr = useLink(linkedArray);
  const [input, setInput] = useState(0);

  const handleAdd = () => {
    arr().push(input);
    setInput(input + 1);
  };

  const handleUnshift = () => {
    arr().unshift(input);
    setInput(input + 1);
  };

  const handlePop = () => {
    arr().pop();
  };

  const handleShift = () => {
    arr().shift();
  };

  const handleReverse = () => {
    arr().reverse();
  };

  const handleSort = () => {
    arr().sort((a, b) => a - b);
  };

  const handleClear = () => {
    // simplest way to clear (splice from start to end)
    arr().splice(0, arr().length);
  };

  const handleRemove = (item: number) => {
    arr().remove(item);
  };

  const result = [];

  for (let i = 0; i < arr().length; i++) {
    const baseline = pad + TAB_SIZE;
    const elem = arr().at(i);
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <DebugOutReact
        key={`elem-${i}`}
        val={elem}
        pad={baseline}
        path={`${path}/${i}`}
        showUnknowns={showUnknowns}
      />,
      " ",
      <TxtButton title="delete" onClick={() => elem && handleRemove(elem)}>
        del.
      </TxtButton>
    );
  }

  if (result.length > -1) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={arr()} /> {"["}
      <br />
      {" ".repeat(TAB_SIZE)}
      <TxtButton
        title="unshift"
        onClick={handleUnshift}
        className="bg-transparent"
      >
        +,
      </TxtButton>{" "}
      <TxtButton title="shift" onClick={handleShift}>
        -,
      </TxtButton>{" "}
      <TxtButton title="push" onClick={handleAdd}>
        ,+
      </TxtButton>{" "}
      <TxtButton title="pop" onClick={handlePop}>
        ,-
      </TxtButton>
      <span className="text-gray-500"> (len. {arr.length})</span>
      {result}
      {"]"}{" "}
      <TxtButton title="Reverse" onClick={handleReverse}>
        rev.
      </TxtButton>{" "}
      <TxtButton title="Sort" onClick={handleSort}>
        sort
      </TxtButton>{" "}
      <TxtButton title="Clear" onClick={handleClear}>
        clear
      </TxtButton>
    </>
  );
}
