import { ReactNode, useState } from "react";
import { exhaustive } from "../../structured-state/src/assertions";

export type JSON =
  | string
  | number
  | boolean
  | null
  | JSON[]
  | { [key: string]: JSON };

const TAB_SIZE = 2;
type DisplayState = "full" | "summary" | "collapsed";

export function JSONView({
  json,
  showUnknowns = false,
  style,
}: {
  json: JSON;
  showUnknowns?: boolean;
  style?: React.CSSProperties;
}) {
  console.log("val", json);
  return (
    <div style={{ overflow: "scroll", ...style }}>
      <pre style={{ textAlign: "left", width: 300, fontSize: 12 }}>
        <DebugOutReact
          val={json}
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
  val: JSON;
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
    return <JSONPrimitive val={val} />;
  } else if (Array.isArray(val)) {
    return (
      <JSONArray arr={val} pad={pad} path={path} showUnknowns={showUnknowns} />
    );
  } else if (
    typeof val === "function" ||
    typeof val === "bigint" ||
    typeof val === "symbol"
  ) {
    return `(invalid: ${typeof val}:${val})`;
  } else {
    return <JSONRecord record={val} pad={pad} showUnknowns={showUnknowns} />;
  }
}

function Collapser({
  display,
  setDisplay,
}: {
  display: DisplayState;
  setDisplay: React.Dispatch<React.SetStateAction<DisplayState>>;
}) {
  return (
    <span
      className={classOfKind("classname")}
      style={{ userSelect: "none", cursor: "pointer" }}
      onClick={() => {
        setDisplay((prev) => {
          switch (prev) {
            case "full":
              return "summary";
            case "summary":
              return "full";
            case "collapsed":
              return "full";
            default:
              exhaustive(prev);
          }
        });
      }}
    >
      {display === "collapsed" ? "▶" : display === "full" ? "▼" : "⊖"}
    </span>
  );
}

function JSONRecord({
  record,
  pad,
  path = "",
  showUnknowns,
}: {
  record: { [key: string]: JSON };
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>("summary");

  const body: Array<ReactNode> = ["{"];
  const keys = Object.keys(record);

  if (displayState === "summary") {
    body.push(<span className={classOfKind("prm")}> {keys.join(", ")} </span>);
  }

  for (let i = 0; i < keys.length && displayState === "full"; i++) {
    const key = keys[i];
    const baseline = pad + TAB_SIZE;

    const val = record[key];

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

  if (displayState === "collapsed") {
    body.push("...", "}");
  } else if (displayState === "full") {
    body.push("\n", " ".repeat(pad), "}");
  } else if (displayState === "summary") {
    body.push("}");
  }
  return (
    <>
      <Collapser display={displayState} setDisplay={setDisplayState} /> {body}
    </>
  );
}

function string(val: JSON, depth?: number): string {
  if (depth === 0) {
    return "...";
  }

  const depthn = typeof depth === "number" ? depth - 1 : depth;
  if (typeof val === "string") {
    return val;
  } else if (
    typeof val === "number" ||
    typeof val === "boolean" ||
    val == null
  ) {
    return String(val);
  } else if (Array.isArray(val)) {
    return `[${val.map((x) => string(x, depthn)).join(", ")}]`;
  } else if (
    typeof val === "function" ||
    typeof val === "bigint" ||
    typeof val === "symbol"
  ) {
    return `(invalid: ${typeof val}:${val})`;
  } else {
    return `{${Object.keys(val)
      .map((key) => `${key}`)
      .join(", ")}}`;
  }
}

function JSONArray({
  arr,
  pad,
  path = "",
  showUnknowns,
}: {
  arr: JSON[];
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>("summary");

  const body = [];

  if (arr.length < 1) {
    return "[]";
  }

  if (displayState === "summary") {
    body.push(
      <span className={classOfKind("prm")}>
        {" "}
        {arr.map((x) => string(x)).join(", ")}{" "}
      </span>
    );
  }

  for (let i = 0; i < arr.length && displayState === "full"; i++) {
    const baseline = pad + TAB_SIZE;
    const elem = arr[i];
    body.push(
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
  }

  if (displayState === "collapsed") {
    body.push("...", "");
  } else if (displayState === "full") {
    body.push("\n", " ".repeat(pad));
  }

  return (
    <>
      <Collapser display={displayState} setDisplay={setDisplayState} />
      {" ["}
      {body}
      {"]"}
    </>
  );
}

function JSONPrimitive({
  val,
}: {
  val: string | number | boolean | null | undefined;
}) {
  switch (true) {
    case typeof val === "string":
      return <span className={classOfKind("string")}>&quot;{val}&quot;</span>;
    case typeof val === "number":
      return <span className={classOfKind("number")}>{String(val)}</span>;
    default:
      return String(val);
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
