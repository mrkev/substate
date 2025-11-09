import { twMerge } from "tailwind-merge";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { usePrimitive } from "../../../linked-state/src/hooks";
import { DebugOutSimplePrm, Header } from "./LinkedStateDebug";
import { TxtButton } from "./TxtButton";

export function LinkedPrimitiveTester({
  linkedPrimitive: linkedPrimitive,
  className,
}: {
  linkedPrimitive: LinkedPrimitive<number>;
  className?: string;
}) {
  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedPrimitive Tester</h2>
      <pre className="text-start text-sm">
        <DebugOutPrimitive obj={linkedPrimitive} />
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
  obj,
  path = "",
}: {
  obj: LinkedPrimitive<number>;
  path?: string;
}) {
  // Hook it into React — updates automatically when the primitive changes
  const [value, setValue] = usePrimitive(obj);

  const increment = () => setValue((v) => v + 1);
  const decrement = () => setValue((v) => v - 1);
  const reset = () => setValue(0);
  const setRandom = () => setValue(Math.floor(Math.random() * 100));

  if (isPrimitiveKind(value)) {
    return (
      <>
        <Header obj={obj} path={`${path}/${obj._id}`} />{" "}
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
        <Header obj={obj} path={`${path}/${obj._id}`} />{" "}
        {
          // todo
          String(value)
        }
      </>
    );
  }
}
