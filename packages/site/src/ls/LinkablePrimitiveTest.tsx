import { twMerge } from "tailwind-merge";
import { LinkableValue } from "../../../linked-state/src/LinkableValue";
import { useLinkAsState } from "../../../linked-state/src/hooks";
import { DebugOutSimplePrm, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

export function LinkablePrimitiveTest({
  prim,
  className,
}: {
  prim: LinkableValue<number>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedPrimitive Tester</h2>
      <pre className="text-start text-sm">
        <DebugOutPrimitive prim={prim} />
      </pre>
    </div>
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

function DebugOutPrimitive({
  prim,
  path = "",
}: {
  prim: LinkableValue<number>;
  path?: string;
}) {
  // Hook it into React — updates automatically when the primitive changes
  const [value, setValue] = useLinkAsState(prim);

  const increment = () => setValue((v) => v + 1);
  const decrement = () => setValue((v) => v - 1);
  const reset = () => setValue(0);
  const setRandom = () => setValue(Math.floor(Math.random() * 100));

  if (isPrimitiveKind(value)) {
    return (
      <>
        <Header obj={prim} path={`${path}/${prim._id}`} />{" "}
        <TxtButton title="decrement" onClick={decrement} children="-" />{" "}
        <DebugOutSimplePrm val={value} />{" "}
        <TxtButton title="increment" onClick={increment} children="+" />{" "}
        <TxtButton title="reset" onClick={reset} children="reset" />{" "}
        <TxtButton title="random" onClick={setRandom} children="random" />
      </>
    );
  } else {
    return (
      <>
        <Header obj={prim} path={`${path}/${prim._id}`} />{" "}
        {
          // todo
          String(value)
        }
      </>
    );
  }
}
