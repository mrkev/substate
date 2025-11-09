import stringify from "json-stringify-deterministic";
import { ReactNode, useState } from "react";
import { useLink, usePrimitive } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { mutationHashable } from "../../../linked-state/src/MutationHashable";
import { exhaustive } from "../../../structured-state/src/assertions";

const TAB_SIZE = 2;
export type DisplayState = "full" | "native" | "collapsed";
type Debuggable =
  | LinkedPrimitive<unknown>
  | LinkedArray<unknown>
  | LinkedMap<unknown, unknown>
  | LinkedSet<unknown>;
export type PrimitiveKind = number | string | boolean | null;

export function LinkedStateDebug({
  val,
  showUnknowns,
  style,
}: {
  val: unknown;
  showUnknowns?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className="overflow-scroll" style={style}>
      <pre className="text-start" style={{ width: 300, fontSize: 12 }}>
        <DebugOutReact
          val={val}
          pad={0}
          path={"ROOT"}
          showUnknowns={showUnknowns}
        />
      </pre>
    </div>
  );
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

export function DebugOutReact({
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
  } else if (val instanceof LinkedArray) {
    return (
      <DebugOutArray
        arr={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof LinkedSet) {
    return (
      <DebugOutSet
        set={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof LinkedPrimitive) {
    return <DebugOutPrimitive obj={val} path={path} />;
  } else if (val instanceof LinkedMap) {
    return (
      <DebugOutMap
        map={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
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

function DebugOutMap({
  map: linkedMap,
  pad,
  path = "",
  showUnknowns,
}: {
  map: LinkedMap<unknown, unknown>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const map = useLink(linkedMap);
  console.log("RENDER", map);
  const [displayState, setDisplayState] = useState<DisplayState>("full");
  const showHeader = displayState === "full";
  const showBody = displayState === "full" || displayState === "native";

  const body: Array<ReactNode> = ["{"];
  const entries = [...map().entries()];

  for (let i = 0; i < entries.length && showBody; i++) {
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
        path={`${path}/${key}`}
        showUnknowns={showUnknowns}
      />
    );
  }

  if (!showBody) {
    body.push("...", "}");
  } else {
    body.push("\n", " ".repeat(pad), "}");
  }

  return (
    <>
      {/* <span
        className={classOfKind("classname")}
        onClick={() => {
          setDisplayState((prev) => {
            switch (prev) {
              case "full":
                return "native";
              case "native":
                return "collapsed";
              case "collapsed":
                return "full";
              default:
                exhaustive(prev);
            }
          });
        }}
      >
        {map.constructor.name}
      </span>{" "} */}
      {showHeader && (
        <>
          <Header obj={linkedMap} path={`${path}/${linkedMap._id}`} />{" "}
        </>
      )}
      {body}
    </>
  );
}

function DebugOutArray({
  arr: linkedArray,
  pad,
  path = "",
  showUnknowns,
}: {
  arr: LinkedArray<unknown>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const arr = useLink(linkedArray);
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
      />
    );
    // result += `\n${DebugOutReact(elem, pad, showUnknowns)
    //   .split("\n")
    //   .map((s) => `  ${s}`)
    //   .join("\n")},`;
  }

  if (result.length > 0) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={arr()} /> {"["}
      {result}
      {"]"}
    </>
  );
}

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

  const result = [];

  let i = 0;
  for (const elem of set()) {
    const baseline = pad + TAB_SIZE;
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <DebugOutReact
        key={`elem-${i}`}
        val={elem}
        pad={baseline}
        path={`${path}/${i}-s`}
        showUnknowns={showUnknowns}
      />
    );
    i++;
    // result += `\n${DebugOutReact(elem, pad, showUnknowns)
    //   .split("\n")
    //   .map((s) => `  ${s}`)
    //   .join("\n")},`;
  }

  if (result.length > 0) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={set()} /> {"("}
      {result}
      {")"}
    </>
  );
}

export function Header({
  obj: objarg,
  path,
  showContainerId = false,
}: {
  obj: Debuggable;
  path?: string;
  showContainerId?: boolean;
}) {
  const obj = useLink(objarg)();

  const kindStr = (() => {
    if (obj instanceof LinkedMap) {
      return "lmap";
    } else if (obj instanceof LinkedArray) {
      return "larr";
    } else if (obj instanceof LinkedSet) {
      return "lset";
    } else if (obj instanceof LinkedPrimitive) {
      return "lprm";
    } else {
      exhaustive(obj);
    }
  })();

  const hashStr = `.${mutationHashable.getMutationHash(obj)}`;

  const container = showContainerId
    ? ` -^ ${[...obj._container.values()].map((v) => v._id).join(",")}`
    : "";

  const hash = <span className={classOfKind("hash")}>{hashStr}</span>;
  return (
    <span className={classOfKind("kind")} title={path}>
      (<span className={classOfKind("kind")}>{kindStr}</span>: {obj._id}
      {hashStr}
      {container})
    </span>
  );
}

function DebugOutPrimitive({
  obj,
  path = "",
}: {
  obj: LinkedPrimitive<any>;
  path?: string;
}) {
  const [val] = usePrimitive(obj);
  if (isPrimitiveKind(val)) {
    return (
      <>
        <Header obj={obj} path={`${path}/${obj._id}`} />{" "}
        <DebugOutSimplePrm val={val} />
      </>
    );
  } else {
    return (
      <>
        <Header obj={obj} path={`${path}/${obj._id}`} />{" "}
        {
          // todo
          String(val)
        }
      </>
    );
  }
}

export function DebugOutSimplePrm({ val }: { val: PrimitiveKind | undefined }) {
  switch (true) {
    case typeof val === "string":
      return <span className={classOfKind("string")}>&quot;{val}&quot;</span>;
    case typeof val === "number":
      return <span className={classOfKind("number")}>{String(val)}</span>;
    default:
      // TODO
      return String(val); // "<unknown TODO>";
    // exhaustive(val);
  }
}

export const classOfKind = (
  kind: "string" | "kind" | "number" | "classname" | "hash" | "attr" | "prm"
): string => {
  switch (kind) {
    case "attr":
      return "hljs-attr";
    case "number":
    case "hash":
      return "hljs-number";
    case "string":
      return "hljs-string";
    case "classname":
      return "hljs-title class_";
    case "prm":
    case "kind":
      return "hljs-comment";
    default:
      exhaustive(kind);
  }
};

function isPrimitiveKind(val: unknown) {
  return (
    typeof val === "number" ||
    typeof val === "string" ||
    typeof val === "boolean" ||
    val === null
  );
}
