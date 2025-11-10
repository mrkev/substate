import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useLink } from "../../../linked-state/src/hooks";
import { LinkableArray } from "../../../linked-state/src/LinkableArray";
import { DynamicTest, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

const TAB_SIZE = 2;

export function LinkableArrayTest({
  linkedArray,
  className,
}: {
  linkedArray: LinkableArray<number>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedArray Tester</h2>
      <pre className="text-start text-sm">
        <DynamicTestArray arr={linkedArray} pad={0} showUnknowns={true} />
      </pre>
    </div>
  );
}

export function DynamicTestArray({
  arr,
  pad,
  path = "",
  showUnknowns,
}: {
  arr: LinkableArray<number>;
  pad: number;
  path?: string;
  showUnknowns?: boolean;
}) {
  const larr = useLink(arr);
  const [input, setInput] = useState(0);

  const handleAdd = () => {
    larr().push(input);
    setInput(input + 1);
  };

  const handleUnshift = () => {
    larr().unshift(input);
    setInput(input + 1);
  };

  const handlePop = () => {
    larr().pop();
  };

  const handleShift = () => {
    larr().shift();
  };

  const handleReverse = () => {
    larr().reverse();
  };

  const handleSort = () => {
    larr().sort((a, b) => a - b);
  };

  const handleClear = () => {
    // simplest way to clear (splice from start to end)
    larr().splice(0, larr().length);
  };

  const handleRemove = (item: number) => {
    larr().remove(item);
  };

  const result = [];

  for (let i = 0; i < larr().length; i++) {
    const baseline = pad + TAB_SIZE;
    const elem = larr().at(i);
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <DynamicTest
        key={`elem-${i}`}
        val={elem}
        pad={baseline}
        path={`${path}/${i}`}
        showUnknowns={showUnknowns}
      />,
      " ",
      <TxtButton
        key={`del-${i}`}
        title="delete"
        onClick={() => elem != null && handleRemove(elem)}
        children="del."
      />
    );
  }

  if (result.length > -1) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={larr()} /> {"["}
      <br />
      {" ".repeat(TAB_SIZE + pad)}
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
      <span className="text-gray-500"> (len. {larr().length})</span>
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
