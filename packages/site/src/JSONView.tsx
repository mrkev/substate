import { ReactNode, useState } from "react";
import { exhaustive } from "../../structured-state/src/lib/assertions";
import { UtilityToggle } from "./UtilityToggle";

export type JSON =
  | string
  | number
  | boolean
  | null
  | JSON[]
  | { [key: string]: JSON };

const TAB_SIZE = 2;
type DisplayState = "full" | "summary" | "collapsed";

// toolbar presets: how many levels of nesting start expanded. 0 shows the
// root as a one-line summary.
const LEVEL_PRESETS: Array<{ label: string; levels: number }> = [
  { label: "collapse all", levels: 0 },
  { label: "1", levels: 1 },
  { label: "2", levels: 2 },
  { label: "3", levels: 3 },
  { label: "expand all", levels: Infinity },
];

export function JSONView({
  json,
  showUnknowns = false,
  style,
  defaultExpandedLevels = 1,
}: {
  json: JSON;
  showUnknowns?: boolean;
  style?: React.CSSProperties;
  /** levels of nesting expanded initially (0 = root collapsed) */
  defaultExpandedLevels?: number;
}) {
  const [levels, setLevels] = useState(defaultExpandedLevels);
  // each node keeps its own expanded state, so applying a preset remounts the
  // tree. Bumped on every click so re-clicking a preset resets manual toggles.
  const [generation, setGeneration] = useState(0);

  return (
    <div style={style}>
      <div className="mb-2 flex items-center gap-1 text-xs">
        <span className="mr-1 text-gray-500">expand:</span>
        {LEVEL_PRESETS.map((preset) => (
          <UtilityToggle
            key={preset.label}
            toggled={levels === preset.levels}
            onToggle={() => {
              setLevels(preset.levels);
              setGeneration((g) => g + 1);
            }}
          >
            {preset.label}
          </UtilityToggle>
        ))}
        <SerializedSize json={json} />
      </div>
      <pre style={{ textAlign: "left", fontSize: 12, overflow: "auto" }}>
        <JsonOutReact
          key={generation}
          val={json}
          pad={0}
          path={"ROOT"}
          showUnknowns={showUnknowns}
          expandLevels={levels}
        />
      </pre>
    </div>
  );
}

const utf8 = new TextEncoder();

/** size of `json` when stringified (compact, UTF-8) */
function SerializedSize({ json }: { json: JSON }) {
  const bytes = utf8.encode(JSON.stringify(json)).byteLength;
  return (
    <span
      className="ml-auto text-gray-500"
      title={`${bytes.toLocaleString()} bytes`}
    >
      {formatBytes(bytes)}
    </span>
  );
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${units[unit]}`;
}

export function JsonOutReact({
  val,
  pad,
  path = "",
  showUnknowns = true,
  expandLevels,
}: {
  val: JSON;
  pad: number;
  path?: string;
  showUnknowns?: boolean;
  expandLevels: number;
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
      <JSONArray
        arr={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
        expandLevels={expandLevels}
      />
    );
  } else if (
    typeof val === "function" ||
    typeof val === "bigint" ||
    typeof val === "symbol"
  ) {
    return `(invalid: ${typeof val}:${val})`;
  } else {
    return (
      <JSONRecord
        record={val}
        pad={pad}
        showUnknowns={showUnknowns}
        expandLevels={expandLevels}
      />
    );
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
      {display === "collapsed" ? "▶" : display === "full" ? "▼" : "⊖"}{" "}
    </span>
  );
}

function JSONRecord({
  record,
  pad,
  path = "",
  showUnknowns,
  expandLevels,
}: {
  record: { [key: string]: JSON };
  pad: number;
  path?: string;
  showUnknowns: boolean;
  expandLevels: number;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>(
    expandLevels > 0 ? "full" : "summary",
  );

  const body: Array<ReactNode> = ["{"];
  const keys = Object.keys(record);

  if (displayState === "summary") {
    body.push(
      <span key={"summary-span"} className={classOfKind("prm")}>
        {" "}
        {keys.join(", ")}{" "}
      </span>,
    );
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
      <JsonOutReact
        key={`elem-${key}`}
        val={val}
        pad={baseline}
        path={`${path}/${key}`}
        showUnknowns={showUnknowns}
        expandLevels={expandLevels - 1}
      />,
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
      <Collapser display={displayState} setDisplay={setDisplayState} />
      {body}
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
  expandLevels,
}: {
  arr: JSON[];
  pad: number;
  path?: string;
  showUnknowns: boolean;
  expandLevels: number;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>(
    expandLevels > 0 ? "full" : "summary",
  );

  const body = [];

  if (arr.length < 1) {
    return "[]";
  }

  if (displayState === "summary") {
    body.push(
      <span key={"summary"} className={classOfKind("prm")}>
        {" "}
        {arr.map((x) => string(x)).join(", ")}{" "}
      </span>,
    );
  }

  for (let i = 0; i < arr.length && displayState === "full"; i++) {
    const baseline = pad + TAB_SIZE;
    const elem = arr[i];
    body.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <JsonOutReact
        key={`elem-${i}`}
        val={elem}
        pad={baseline}
        path={`${path}/${i}`}
        showUnknowns={showUnknowns}
        expandLevels={expandLevels - 1}
      />,
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
      {"["}
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
  kind: "string" | "kind" | "number" | "classname" | "hash" | "attr" | "prm",
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
