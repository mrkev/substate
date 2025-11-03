import { useState } from "react";
import { useContainer, usePrimitive } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { DebugContainer } from "./Debug";

const linkedMap = LinkedMap.create<number, LinkedArray<number>>();
const linkedSet = LinkedSet.create<number>();
const linkedArray = LinkedArray.create<number>();
const linkedPrimitive = LinkedPrimitive.of(0);

export function LinkedStateTest2() {
  const map = useContainer(linkedMap);

  const [key, setKey] = useState(0);

  const handleAdd = () => {
    map.set(key, LinkedArray.create([2]));
    console.log("added", map);
    setKey(key + 1);
  };

  const handleDelete = (k: number) => {
    map.delete(k);
  };

  const handleClear = () => {
    map.clear();
  };

  // Convert map to array for rendering
  const entries = Array.from(map.entries());

  return (
    <div className="grid grid-cols-4">
      <DebugContainer val={linkedMap}></DebugContainer>
      <div
        style={{ fontFamily: "sans-serif", maxWidth: 400, margin: "1rem auto" }}
      >
        <h2>LinkedMap Tester</h2>
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          <button onClick={handleAdd}>Add</button>
          <button onClick={handleClear}>Clear</button>
        </div>

        <ul>
          {entries.length === 0 ? (
            <li style={{ color: "#888" }}>Map is empty</li>
          ) : (
            entries.map(([k, v]) => (
              <li key={k}>
                <b>{k}</b>: {v}{" "}
                <button onClick={() => handleDelete(k)}>Delete</button>
                {/* <LinkedPrimitiveEditor /> */}
              </li>
            ))
          )}
        </ul>

        <div style={{ marginTop: "1rem", color: "#555" }}>
          <small>Size: {map.size}</small>
        </div>
      </div>
    </div>
  );
}

export function LinkedPrimitiveEditor({
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
