import stringify from "json-stringify-deterministic";
import { PrimitiveKind, set, SSet, string, Structured } from ".";
import { SArray, SSchemaArray } from "./SArray";
import { Struct } from "./Struct";
import { Struct2 } from "./Struct2";
import { isPrimitiveKind, StructuredKind } from "./StructuredKinds";
import { exhaustive } from "./assertions";
import { LinkedPrimitive } from "./state/LinkedPrimitive";
import { MutationHashable } from "./state/MutationHashable";
import { CONTAINER_IGNORE_KEYS } from "./state/SubbableContainer";
import { SUnion } from "./sunion";
import { ReactElement, ReactNode, useState } from "react";

// TODO: allow for unregistered objects, so this doesn't show up on global known objects?
const collapsedPaths = set<string>();
const collapseClasses = set<string>();

export function DebugOut({
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
  } else if (val instanceof SArray) {
    return (
      <DebugOutArray
        arr={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof SSchemaArray) {
    return (
      <DebugOutArray
        arr={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof SSet) {
    return (
      <DebugOutSet
        set={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof LinkedPrimitive) {
    return <DebugOutSPrimitive obj={val} path={path} />;
  } else if (val instanceof Struct) {
    return (
      <DebugOutStruct
        struct={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof Struct2) {
    return (
      <DebugOutStruct
        struct={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof Structured) {
    return (
      <DebugOutStruct
        struct={val}
        pad={pad}
        path={path}
        showUnknowns={showUnknowns}
      />
    );
  } else if (val instanceof SUnion) {
    return (
      <DebugOutUnion
        union={val}
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

function DebugOutUnion({
  union,
  pad,
  showUnknowns,
}: {
  union: SUnion<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  return "union, todo";
}

const TAB_SIZE = 2;
type DisplayState = "full" | "native" | "collapsed";

function DebugOutStruct({
  struct,
  pad,
  path = "",
  showUnknowns,
}: {
  struct: Struct<any> | Struct2<any> | Structured<any, any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>("full");
  const showHeader = displayState === "full";
  const showBody = displayState === "full" || displayState === "native";

  const body: Array<ReactNode> = ["{"];
  const keys = Object.keys(struct);

  for (let i = 0; i < keys.length && showBody; i++) {
    const key = keys[i];
    const baseline = pad + TAB_SIZE;
    if (struct instanceof Structured && CONTAINER_IGNORE_KEYS.has(key)) {
      continue;
    }
    if (CONTAINER_IGNORE_KEYS.has(key)) {
      continue;
    }
    const val: unknown = (struct as any)[key];
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
      <span
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
        {struct.constructor.name}
      </span>{" "}
      {showHeader && (
        <>
          <Header obj={struct} path={`${path}/${struct._id}`} />{" "}
        </>
      )}
      {body}
    </>
  );
}

function DebugOutArray({
  arr,
  pad,
  path = "",
  showUnknowns,
}: {
  arr: SArray<any> | SSchemaArray<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const baseline = pad + TAB_SIZE;
    const elem = arr.at(i);
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
      <Header obj={arr} /> {"["}
      {result}
      {"]"}
    </>
  );
}

function DebugOutSet({
  set,
  pad,
  path = "",
  showUnknowns,
}: {
  set: SSet<any>;
  pad: number;
  path?: string;
  showUnknowns: boolean;
}) {
  const result = [];

  let i = 0;
  for (const elem of set) {
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
      <Header obj={set} /> {"("}
      {result}
      {")"}
    </>
  );
}

function Header({
  obj,
  path,
  showContainerId = false,
}: {
  obj: StructuredKind;
  path?: string;
  showContainerId?: boolean;
}) {
  const kindStr = (() => {
    if (obj instanceof SArray) {
      return "arr";
    } else if (obj instanceof SSchemaArray) {
      return "s_arr";
    } else if (obj instanceof SSet) {
      return "set";
    } else if (obj instanceof LinkedPrimitive) {
      return "prm";
    } else if (obj instanceof Struct) {
      return "Sct";
    } else if (obj instanceof Struct2) {
      return "Sct2";
    } else if (obj instanceof Structured) {
      return "Strd";
    } else if (obj instanceof SUnion) {
      return "uni";
    } else {
      exhaustive(obj);
    }
  })();

  const hashStr =
    obj instanceof LinkedPrimitive
      ? ""
      : `.${MutationHashable.getMutationHash(obj)}`;

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

function DebugOutSPrimitive({
  obj,
  path = "",
}: {
  obj: LinkedPrimitive<any>;
  path?: string;
}) {
  const val = obj.get();
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
