import stringify from "json-stringify-deterministic";
import { ReactNode, useState } from "react";
import { isContainable } from "../lib/Contained";
import { MarkedSubbable, SubbableMark } from "../lib/SubbableMark";
import { exhaustive } from "../src/exhaustive";
import { useLink } from "../src/hooks";
import { MarkedArray } from "../src/MarkedArray";
import { MarkedMap } from "../src/MarkedMap";
import { MarkedSet } from "../src/MarkedSet";
import { MarkedValue } from "../src/MarkedValue";

type PrimitiveKind = number | string | boolean | null;

function isPrimitiveKind(val: unknown) {
  return (
    typeof val === "number" ||
    typeof val === "string" ||
    typeof val === "boolean" ||
    val == null
  );
}

const TAB_SIZE = 2;
type DisplayState =
  | "full"
  // | "native"
  | "collapsed";

export function DebugTree({
  val,
  showUnknowns,
  style,
}: {
  val: unknown;
  showUnknowns?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ overflow: "scroll", ...style }}>
      <pre style={{ textAlign: "left", width: 300, fontSize: 12 }}>
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
  if (isPrimitiveKind(val)) {
    return <DebugOutSimplePrm val={val} />;
  } else if (typeof val === "function") {
    return "(function)";
  } else if (val instanceof MarkedArray) {
    return (
      <TreeMarkedArray
        marr={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof MarkedSet) {
    return (
      <TreeMarkedSet
        mset={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof MarkedMap) {
    return (
      <TreeMarkedMap
        map={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof MarkedValue) {
    return <TreeMarkedValue obj={val} path={path} />;
  } else if (isContainable(val)) {
    return (
      // TODO
      <TreeMarkedSubbable
        mobj={val}
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

function TreeMarkedSubbable({
  mobj,
  pad,
  path = "",
  showUnknowns,
}: {
  mobj: MarkedSubbable;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const struct = useLink(mobj);

  const [displayState, setDisplayState] = useState<DisplayState>("full");
  const showHeader = displayState === "full";
  const showBody = displayState === "full"; // || displayState === "native";

  const body: Array<ReactNode> = ["{"];
  const keys = Object.keys(struct());

  for (let i = 0; i < keys.length && showBody; i++) {
    const key = keys[i];
    const baseline = pad + TAB_SIZE;
    if (key === "$$mark") {
      continue;
    }

    const val: unknown = (struct() as any)[key];
    body.push(
      <br key={`br-${key}`} />,
      " ".repeat(baseline),
      <span key={`span-${key}`} className={classOfKind("attr")}>
        {key}
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
      <Header obj={struct()} path={`${path}/${struct().$$mark._id}`} />{" "}
      <span
        style={{ cursor: "pointer" }}
        className={classOfKind("classname")}
        onClick={() => {
          setDisplayState((prev) => {
            switch (prev) {
              case "full":
                return "collapsed";
              // case "native":
              //   return "collapsed";
              case "collapsed":
                return "full";
              default:
                exhaustive(prev);
            }
          });
        }}
      >
        {struct().constructor.name}
      </span>{" "}
      {body}
    </>
  );
}

function TreeMarkedArray({
  marr,
  pad,
  path = "",
  showUnknowns,
}: {
  marr: MarkedArray<unknown>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const arr = useLink(marr);

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

function TreeMarkedSet({
  mset,
  pad,
  path = "",
  showUnknowns,
}: {
  mset: MarkedSet<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const result = [];
  const set = useLink(mset);

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

function TreeMarkedMap({
  map: mmap,
  pad,
  path = "",
  showUnknowns,
}: {
  map: MarkedMap<unknown, unknown>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const result = [];
  const map = useLink(mmap);

  let i = 0;
  for (const [key, value] of map()) {
    const baseline = pad + TAB_SIZE;
    result.push(
      <br key={`br-${key}`} />,
      " ".repeat(baseline),
      <DebugOutReact
        key={`key-${i}`}
        val={key}
        pad={baseline}
        path={`${path}/${i}-s`}
        showUnknowns={showUnknowns}
      />,
      ": ",
      <DebugOutReact
        key={`value-${i}`}
        val={value}
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
      <Header obj={map()} /> {"("}
      {result}
      {")"}
    </>
  );
}

function TreeMarkedValue({
  obj,
  path = "",
}: {
  obj: MarkedValue<any>;
  path?: string;
}) {
  const val = useLink(obj)().get();
  if (isPrimitiveKind(val)) {
    return (
      <>
        <Header obj={obj} path={`${path}/${obj.$$mark._id}`} />{" "}
        <DebugOutSimplePrm val={val} />
      </>
    );
  } else {
    return (
      <>
        <Header obj={obj} path={`${path}/${obj.$$mark._id}`} />{" "}
        {
          // todo
          String(val)
        }
      </>
    );
  }
}

function Header({
  obj,
  path,
  showContainerId = false,
}: {
  obj: MarkedSubbable;
  path?: string;
  showContainerId?: boolean;
}) {
  const container = showContainerId
    ? ` -^ ${[...obj.$$mark._container.values()]
        .map((v) => v.$$mark._id)
        .join(",")}`
    : "";

  const kindStr = (() => {
    if (obj instanceof MarkedArray) {
      return "arr";
    } else if (obj instanceof MarkedMap) {
      return "map";
    } else if (obj instanceof MarkedSet) {
      return "set";
    } else if (obj instanceof MarkedValue) {
      return "val";
    } else {
      return "obj";
    }
  })();

  // const titleKind = obj instanceof MarkedArray | obj instanceof MarkedMap | obj instanceof MarkedSet | obj instanceof MarkedValue ? 'kind'

  return (
    <span className={classOfKind("kind")} title={path}>
      (
      {/*<span className={classOfKind("kind")}>{obj.constructor.name}</span>:{" "} */}
      {kindStr}.{obj.$$mark._id}.{obj.$$mark._hash}
      {container})
    </span>
  );
}

function DebugOutSimplePrm({ val }: { val: PrimitiveKind | undefined }) {
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

const classOfKind = (
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
