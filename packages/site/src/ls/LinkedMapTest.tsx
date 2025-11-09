import { ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { useLink } from "../../../linked-state/src/hooks";
import { classOfKind, DebugOutReact, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

export function LinkedMapTest({
  map,
  className,
}: {
  map: LinkedMap<number, string>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedArray Tester</h2>
      <pre className="text-start text-sm">
        <DebugOutMap map={map} pad={0} showUnknowns={true} />
      </pre>
    </div>
  );
}

const TAB_SIZE = 2;

function DebugOutMap({
  map: linkedMap,
  pad,
  path = "",
  showUnknowns,
}: {
  map: LinkedMap<number, any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const lmap = useLink(linkedMap);

  const body: Array<ReactNode> = [];
  const entries = [...lmap().entries()];

  const [key, setKey] = useState(0);

  const handleAdd = () => {
    lmap().set(key, "foo");
    setKey(key + 1);
  };

  const handleDelete = (k: number) => {
    lmap().delete(k);
  };

  const handleClear = () => {
    lmap().clear();
  };

  for (let i = 0; i < entries.length; i++) {
    const [key, val] = entries[i];
    const baseline = pad + TAB_SIZE;

    body.push(
      <br key={`br-${key}`} />,
      " ".repeat(baseline),
      <span key={`span-${key}`} className={classOfKind("attr")}>
        {String(key)}
      </span>,
      ": ",
      <DebugOutReact
        key={`elem-${key}`}
        val={val}
        pad={baseline}
        path={`${path}/s${key}`}
        showUnknowns={showUnknowns}
      />,
      " ",
      <TxtButton
        title="delete"
        onClick={() => handleDelete(key)}
        className="bg-transparent"
        children="del."
      />
    );
  }

  body.push("\n", " ".repeat(pad), "}");

  return (
    <>
      <Header obj={linkedMap} path={`${path}/${linkedMap._id}`} /> {"{"}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      <TxtButton
        title="add"
        onClick={handleAdd}
        className="bg-transparent"
        children=" + "
      />
      <span className="text-gray-500">(len. {lmap().size})</span> {body}{" "}
      {/*  */}
      <TxtButton title="clear" onClick={handleClear} children="clear" />
    </>
  );
}
