import { useState } from "react";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { useLink } from "../../../linked-state/src/hooks";

export function LinkedMapTest({ map }: { map: LinkedMap<number, string> }) {
  const lmap = useLink(map);
  const [key, setKey] = useState(0);

  const handleAdd = () => {
    lmap().set(key, "foo");
    setKey(key + 1);
  };

  const handleDelete = (k: number) => {
    lmap().delete(k);
  };

  const handleClear = () => {
    lmap().clear();
  };

  // Convert map to array for rendering
  const entries = Array.from(lmap().entries());

  return (
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
            </li>
          ))
        )}
      </ul>

      <div style={{ marginTop: "1rem", color: "#555" }}>
        <small>Size: {lmap().size}</small>
      </div>
    </div>
  );
}
