import { useState } from "react";
import { LinkableSet } from "../../../linked-state/src/LinkableSet";
import { useLink } from "../../../linked-state/src/hooks";
import { DynamicTest, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";
import { Panel } from "../ui/Panel";
import { useRenderFlash } from "../ui/renderFlash";

export function LinkableSetTest({
  linkedSet,
  className,
}: {
  linkedSet: LinkableSet<number>;
  className?: string;
}) {
  return (
    <Panel title="LinkableSet" className={className}>
      <pre className="text-sm">
        <DebugOutSet set={linkedSet} pad={0} showUnknowns={false} />
      </pre>
    </Panel>
  );
}

const TAB_SIZE = 2;

function DebugOutSet({
  set,
  pad,
  path = "",
  showUnknowns,
}: {
  set: LinkableSet<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const lset = useLink(set);
  const [input, setInput] = useState(0);
  const ref = useRenderFlash<HTMLSpanElement>();

  const handleAdd = () => {
    lset().add(input);
    setInput(input + 1);
  };

  const handleDelete = (value: number) => {
    lset().delete(value);
  };

  const handleClear = () => {
    lset().clear();
  };

  const result = [];

  let i = 0;
  for (const elem of lset()) {
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
    <span ref={ref}>
      <Header obj={lset()} /> {"("}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      <TxtButton
        title="add"
        onClick={handleAdd}
        className="bg-transparent"
        children=" + "
      />
      <span className="text-gray-500">(len. {lset().size})</span>
      {result}
      {")"}{" "}
      <TxtButton title="clear" onClick={handleClear}>
        clear
      </TxtButton>
    </span>
  );
}
