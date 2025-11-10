import { ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { LinkableMap } from "../../../linked-state/src/LinkableMap";
import { useLink } from "../../../linked-state/src/hooks";
import { classOfKind, DynamicTest, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

export function LinkableMapTest({
  map,
  className,
}: {
  map: LinkableMap<number, string>;
  className?: string;
}) {
  const [key, setKey] = useState(0);
  const handleAdd = () => {
    map.set(key, "foo");
    setKey(key + 1);
  };

  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedArray Tester</h2>
      <pre className="text-start text-sm">
        <DynamicTestMap
          map={map}
          pad={0}
          showUnknowns={true}
          onAdd={handleAdd}
          renderValue={(val, key, pad, path, showUnknowns) => (
            <DynamicTest
              val={val}
              key={key}
              pad={pad}
              path={`${path}/s${key}`}
              showUnknowns={showUnknowns}
            />
          )}
        />
      </pre>
    </div>
  );
}

const TAB_SIZE = 2;

export function DynamicTestMap<T>({
  map,
  pad,
  path = "",
  showUnknowns,
  onAdd,
  renderValue,
}: {
  map: LinkableMap<number, T>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
  onAdd: () => void;
  renderValue: (
    v: T,
    key: string,
    pad: number,
    path: string,
    showUnknowns?: boolean
  ) => React.ReactNode;
}) {
  const lmap = useLink(map);
  const handleDelete = (k: number) => lmap().delete(k);
  const handleClear = () => lmap().clear();

  const entries = [...lmap().entries()];
  const body: Array<ReactNode> = [];

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
      renderValue(val, `elem-${key}`, pad, path, showUnknowns),
      " ",
      <TxtButton
        key={`del-${key}`}
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
      <Header obj={map} path={`${path}/${map._id}`} /> {"{"}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      <TxtButton
        title="add"
        onClick={onAdd}
        className="bg-transparent"
        children=" + "
      />
      <span className="text-gray-500">(len. {lmap().size})</span> {body}{" "}
      {/*  */}
      <TxtButton title="clear" onClick={handleClear} children="clear" />
    </>
  );
}
