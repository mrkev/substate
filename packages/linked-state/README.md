## LinkableState

React-compatible (incl. React Compiler) state-management library for React. **Prioritizes efficiency.**

There's 4 primitives:

- **LinkableValue**
- **LinkableArray**
- **LinkableMap**
- **LinkableSet**

There's 3 key features:

- These state objects are mutable, but will trigger react updates when _"linked"_ to a component.
- These state objects can be nested inside one another. When linking, you can listen to _shallow_ or _deep_ updates.
- This is all React Compiler compatible.

## LinkableValue

Wraps a value to make it linkable:

```typescript
// creates a linkable value from this number
const countState = lValue(0);

count.get(); // reads the value
count.set(); // sets the value
```

Usage with React:

```tsx
const counterState = lValue(0);

function App() {
  // link this component to counterState. When counterState
  // is updated, this component will re-render.
  const counter = useLink(counterState);

  return (
    <div>
      {/* counter() gets the latest counterState */}
      count: {counter().get()}
      {/* state is updated directly on linkable */}
      <button onClick={() => counterState.set(counter().get() + 1)}>
        increment
      </button>
    </div>
  );
}

// the linkable can be updated outside react too
window.addEventListener("keydown", function () {
  counter.set(counter.get() + 1);
});
```

## LinkableArray

Creates a linkable Array-like:

```typescript
const datesState = lArray([new Date()]);

datesState.at(0);
datesState.push(new Date());
datesState.map((date) => {});
// etc...
```

## LinkableMap

Creates a linkable Map:

```typescript
const taskState = lMap([
  ["buy milk", "done"],
  ["buy eggs", "pending"],
]);

taskState.set("buy eggs", "done");
taskState.get("buy milk");
taskState.has("buy tortillas"); // false
// etc...
```

## LinkableSet

Creates a linkable Set:

```typescript
const visitorsState = lSet(["Ajay", "Kevin"]);

visitorsState.add("Ajay");
visitorsState.delete("Kevin");
visitorsState.size; // 2
// etc...
```

## Nested Structures

Linkables are nestable. This allows you to mutate your application state,
but still trigger state updates where you need them

Example:

```tsx
// represents a task list
const listState = lMap([
  ["buy milk", lValue(true)],
  ["buy eggs", lValue(false)],
]);

function ListExample() {
  const list = useLink(listState);

  return (
    <>
      <ListSummary />
      <ul>
        {list()
          .entries()
          .map(([name, doneState], i) => (
            <ListItem key={i} name={name} doneState={doneState} />
          ))
          .toArray()}
      </ul>
    </>
  );
}

function ListSummary() {
  // second argument: listen to recursive changes.
  // ie, this component will re-render when the done
  // state for list items changes
  const todoList = useLink(listState, true);

  const done = todoList()
    .entries()
    .filter(([listItem, done]) => {
      return done.get() == true;
    })
    .toArray();

  return <i>Tasks done: {done.length}</i>;
}

function ListItem({
  name,
  doneState,
}: {
  name: string;
  doneState: LinkableValue<boolean>;
}) {
  const done = useLink(doneState);

  return (
    <li>
      {name}:{" "}
      {done().get() ? (
        "done"
      ) : (
        <button onClick={() => doneState.set(true)}>mark done</button>
      )}
    </li>
  );
}
```

In the example above, when buy eggs is marked as done:

- no new data structure is created, good for memory use
- state isn't iterated to be updated, good for performance
- only `List Summary`, and the "buy eggs" `ListItem` will be updated
  (not the "buy milk" `ListItem`), good for performance
- no "set" functions have to be passed around, succint
