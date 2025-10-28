import { useState } from "react";
import { useContainer } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";

export function LinkedArrayTest({
  linkedArray,
}: {
  linkedArray: LinkedArray<number>;
}) {
  const [input, setInput] = useState(0);
  const arr = useContainer(linkedArray);

  const handleAdd = () => {
    arr.push(input);
    setInput(input + 1);
  };

  const handleUnshift = () => {
    if (!input) return;
    arr.unshift(input);
    setInput(input + 1);
  };

  const handlePop = () => {
    arr.pop();
  };

  const handleShift = () => {
    arr.shift();
  };

  const handleReverse = () => {
    arr.reverse();
  };

  const handleSort = () => {
    arr.sort((a, b) => a - b);
  };

  const handleClear = () => {
    // simplest way to clear (splice from start to end)
    arr.splice(0, arr.length);
  };

  const handleRemove = (item: number) => {
    arr.remove(item);
  };

  const items = Array.from(arr.values());

  return (
    <div
      style={{ fontFamily: "sans-serif", maxWidth: 400, margin: "1rem auto" }}
    >
      <h2>LinkedArray Tester</h2>

      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        <button onClick={handleAdd}>Push</button>
        <button onClick={handleUnshift}>Unshift</button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <button onClick={handlePop}>Pop</button>
        <button onClick={handleShift}>Shift</button>
        <button onClick={handleReverse}>Reverse</button>
        <button onClick={handleSort}>Sort</button>
        <button onClick={handleClear}>Clear</button>
      </div>

      <ul>
        {items.length === 0 ? (
          <li style={{ color: "#888" }}>Array is empty</li>
        ) : (
          items.map((v, i) => (
            <li key={i}>
              {v} <button onClick={() => handleRemove(v)}>Remove</button>
            </li>
          ))
        )}
      </ul>

      <div style={{ marginTop: "1rem", color: "#555" }}>
        <small>Length: {arr.length}</small>
      </div>
    </div>
  );
}
