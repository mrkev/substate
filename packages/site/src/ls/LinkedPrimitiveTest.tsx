import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { usePrimitive } from "../../../linked-state/src/hooks";

export function LinkedPrimitiveTester({
  linkedPrimitive: linkedPrimitive,
}: {
  linkedPrimitive: LinkedPrimitive<number>;
}) {
  // Hook it into React — updates automatically when the primitive changes
  const [value, setValue] = usePrimitive(linkedPrimitive);

  const increment = () => setValue((v) => v + 1);
  const decrement = () => setValue((v) => v - 1);
  const reset = () => setValue(0);
  const setRandom = () => setValue(Math.floor(Math.random() * 100));

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 300,
        margin: "1rem auto",
        textAlign: "center",
      }}
    >
      <h2>LinkedPrimitive Tester</h2>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        {value}
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button onClick={decrement}>-</button>
        <button onClick={increment}>+</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button onClick={setRandom}>Random</button>
      </div>
    </div>
  );
}
