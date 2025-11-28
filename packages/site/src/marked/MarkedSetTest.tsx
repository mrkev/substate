import stringify from "json-stringify-deterministic";
import {
  MarkedSet,
  MarkedSubbable,
  useLink,
} from "../../../subbable-state/index";
import { classOfKind, DebugOutSimplePrm } from "../ls/LinkedStateDebug";
import { TxtButton } from "../ls/TxtButton";

export const TAB_SIZE = 2;

export function DebugOutMarkedSet<T>({
  set,
  pad,
  path = "",
  showUnknowns,
  handleAdd,
  handleDelete,
  renderValue,
}: {
  set: MarkedSet<T>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
  handleAdd?: () => void;
  handleDelete?: (value: T) => void;
  renderValue: (
    v: T,
    key: string,
    pad: number,
    path: string,
    showUnknowns?: boolean
  ) => React.ReactNode;
}) {
  const lset = useLink(set);

  const handleClear = () => {
    lset().clear();
  };

  const result = [];

  let i = 0;
  for (const value of lset()) {
    const baseline = pad + TAB_SIZE;
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      renderValue(value, `elem-${i}`, baseline, `${path}/${i}-s`, showUnknowns),
      " ",
      handleDelete && (
        <TxtButton
          title="shift"
          onClick={() => handleDelete(value)}
          children="del."
        />
      )
    );
    i++;
  }

  if (result.length > -1) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={lset()} /> {"("}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      {handleAdd && (
        <TxtButton
          title="add"
          onClick={handleAdd}
          className="bg-transparent"
          children=" + "
        />
      )}
      <span className="text-gray-500">(len. {lset().size})</span>
      {result}
      {")"}{" "}
      <TxtButton title="clear" onClick={handleClear}>
        clear
      </TxtButton>
    </>
  );
}

export function Header({
  obj: objarg,
  path,
  showContainerId = false,
}: {
  obj: MarkedSubbable;
  path?: string;
  showContainerId?: boolean;
}) {
  // we are printing the _hash, which changes every time any child changes,
  // so we want to listen ot recursive changes
  const obj = useLink(objarg, true)();

  const kindStr = (() => {
    return obj.constructor.name;
    // if (obj instanceof LinkableMap) {
    //   return "lmap";
    // } else if (obj instanceof LinkableArray) {
    //   return "larr";
    // } else if (obj instanceof LinkableSet) {
    //   return "lset";
    // } else if (obj instanceof LinkableValue) {
    //   return "lprm";
    // } else {
    //   exhaustive(obj);
    // }
  })();

  const hashStr = `.${obj.$$mark._hash}`;

  const container = showContainerId
    ? ` -^ ${[...obj.$$mark._container.values()]
        .map((v) => v.$$mark._id)
        .join(",")}`
    : "";

  const hash = <span className={classOfKind("hash")}>{hashStr}</span>;
  return (
    <span className={classOfKind("kind")} title={path}>
      (<span className={classOfKind("kind")}>{kindStr}</span>: {obj.$$mark._id}
      {hashStr}
      {container})
    </span>
  );
}

export function DynamicTest({
  val,
  pad,
  path = "",
  showUnknowns = true,
}: {
  val: unknown;
  pad: number;
  path?: string;
  showUnknowns?: boolean;
}) {
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val == null
  ) {
    return <DebugOutSimplePrm val={val} />;
  } else if (typeof val === "function") {
    return "(function)";
    // } else if (val instanceof LinkableArray) {
    //   return (
    //     <DebugOutArray
    //       arr={val}
    //       pad={pad}
    //       path={path}
    //       showUnknowns={showUnknowns}
    //     />
    //   );
  } else if (val instanceof MarkedSet) {
    return (
      <DebugOutMarkedSet
        set={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
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
    );
    // } else if (val instanceof LinkableValue) {
    //   return <DebugOutPrimitive obj={val} path={path} />;
    // } else if (val instanceof LinkableMap) {
    //   return (
    //     <DebugOutMap
    //       map={val}
    //       pad={pad}
    //       path={path}
    //       showUnknowns={showUnknowns}
    //     />
    //   );
  } else if (Array.isArray(val)) {
    return JSON.stringify(val);
  } else {
    if (showUnknowns) {
      return `(unknown: ${stringifyUnknown(val)})`;
    } else {
      return `(unknown: ${val.constructor.name})`;
    }
  }
}

function stringifyUnknown(val: unknown) {
  const res = stringify(val, {
    space: " ",
    cycles: true,
  });
  if (res === "{\n}") {
    return "{}";
  } else {
    return res;
  }
}
