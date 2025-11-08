import { useState } from "react";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { useLink } from "../../../linked-state/src/hooks";

export function LinkedSetTest({ linkedSet }: { linkedSet: LinkedSet<number> }) {
  const set = useLink(linkedSet);
  const [input, setInput] = useState(0);

  const handleAdd = () => {
    set().add(input);
    setInput(input + 1);
  };

  const handleDelete = (value: number) => {
    set().delete(value);
  };

  const handleClear = () => {
    set().clear();
  };

  // Convert to array for rendering
  const items = Array.from(set().values());

  return (
    <div
      style={{ fontFamily: "sans-serif", maxWidth: 400, margin: "1rem auto" }}
    >
      <h2>LinkedSet Tester</h2>

      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleClear}>Clear</button>
      </div>

      <ul>
        {items.length === 0 ? (
          <li style={{ color: "#888" }}>Set is empty</li>
        ) : (
          items.map((v) => (
            <li key={v}>
              {v} <button onClick={() => handleDelete(v)}>Delete</button>
            </li>
          ))
        )}
      </ul>

      <div style={{ marginTop: "1rem", color: "#555" }}>
        <small>Size: {set().size}</small>
      </div>
    </div>
  );
}
