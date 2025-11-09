import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useLink } from "../../../linked-state/src/hooks";
import { LinkedArray } from "../../../linked-state/src/LinkedArray";
import { LinkedMap } from "../../../linked-state/src/LinkedMap";
import { LinkedPrimitive } from "../../../linked-state/src/LinkedPrimitive";
import { LinkedSet } from "../../../linked-state/src/LinkedSet";
import { DynamicTestArray } from "./LinkedArrayTest";
import { DynamicTestMap } from "./LinkedMapTest";

const map = LinkedMap.create<number, LinkedArray<number>>();
const linkedSet = LinkedSet.create<number>();
const linkedPrimitive = LinkedPrimitive.create(0);

export function LinkedStateNestedTest({ className }: { className?: string }) {
  const lmap = useLink(map);

  // Convert map to array for rendering
  const entries = Array.from(lmap().entries());

  const [key, setKey] = useState(0);
  const handleAdd = () => {
    map.set(key, LinkedArray.create([2]));
    setKey(key + 1);
  };

  return (
    <div className={twMerge("overflow-scroll", className)}>
      <h2>LinkedState Tester</h2>
      <pre className="text-start text-sm">
        <DynamicTestMap
          map={map}
          pad={0}
          showUnknowns={true}
          onAdd={handleAdd}
          renderValue={(val, key, pad, path, showUnknowns) => (
            <DynamicTestArray
              arr={val}
              key={key}
              pad={pad + 2}
              path={`${path}/s${key}`}
              showUnknowns={showUnknowns}
            />
          )}
        />
      </pre>
    </div>
  );
}
