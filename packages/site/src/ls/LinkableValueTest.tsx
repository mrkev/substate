import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { useLinkAsState } from "../../../linked-state/src/hooks";
import { DebugOutSimplePrm, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";
import { Panel } from "../ui/Panel";
import { useRenderFlash } from "../ui/renderFlash";

export function LinkableValueTest({
  prim,
  className,
}: {
  prim: LinkableValue<number>;
  className?: string;
}) {
  return (
    <Panel title="LinkableValue" className={className}>
      <pre className="text-sm">
        <DebugOutNumber prim={prim} />
      </pre>
    </Panel>
  );
}

function isPrimitiveKind(val: unknown) {
  return (
    typeof val === "number" ||
    typeof val === "string" ||
    typeof val === "boolean" ||
    val === null
  );
}

function DebugOutNumber({
  prim,
  path = "",
}: {
  prim: LinkableValue<number>;
  path?: string;
}) {
  // Hook it into React — updates automatically when the primitive changes
  const [value, setValue] = useLinkAsState(prim);
  const ref = useRenderFlash<HTMLSpanElement>();

  const increment = () => setValue((v) => v + 1);
  const decrement = () => setValue((v) => v - 1);
  const reset = () => setValue(0);
  const setRandom = () => setValue(Math.floor(Math.random() * 100));

  if (isPrimitiveKind(value)) {
    return (
      <span ref={ref}>
        <Header obj={prim} path={`${path}/${prim._id}`} />{" "}
        <TxtButton title="decrement" onClick={decrement} children="-" />{" "}
        <DebugOutSimplePrm val={value} />{" "}
        <TxtButton title="increment" onClick={increment} children="+" />{" "}
        <TxtButton title="reset" onClick={reset} children="reset" />{" "}
        <TxtButton title="random" onClick={setRandom} children="random" />
      </span>
    );
  } else {
    return (
      <span ref={ref}>
        <Header obj={prim} path={`${path}/${prim._id}`} />{" "}
        {
          // todo
          String(value)
        }
      </span>
    );
  }
}

export function DebugOutBoolean({
  prim,
  path = "",
}: {
  prim: LinkableValue<boolean>;
  path?: string;
}) {
  const [value, setValue] = useLinkAsState(prim);
  const flip = () => setValue((v) => !v);
  const ref = useRenderFlash<HTMLSpanElement>();

  return (
    <span ref={ref}>
      <Header obj={prim} path={`${path}/${prim._id}`} />{" "}
      <DebugOutSimplePrm val={value} />{" "}
      <TxtButton title="flip" onClick={flip} children="toggle" />
    </span>
  );
}
