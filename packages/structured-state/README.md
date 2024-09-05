# Substate

## Usage

1. Primitives:

- `sub.string()`
- `sub.number()`
- `sub.boolean()`
- `sub.nil()`

```tsx
import * as sub from "@mrkev/substate";

const count = sub.number();

function App() {
  const [count, setCount] = useSubstate(count);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>count is {count}</button>
    </div>
  );
}
```

1. Arrays

- `sub.array()`

```tsx
import * as sub from "@mrkev/substate";

const timestamps = sub.array(sub.number());

function App() {
  const timestamps = useSubarray(timestamps);
  return (
    <div>
      <button
        onClick={() => {
          const time = new Date().getTime();
          timestamps.push(time);
        }}
      >
        record time
      </button>

      <ul>
        {timestamps.map((time) => {
          return <li>{time}</li>;
        })}
      </ul>
    </div>
  );
}
```

1. Structs (named objects with known shapes)

- `sub.Struct`
- `sub.create(...)`

```tsx
import * as sub from "@mrkev/substate";

class Person extends sub.Struct<Person> {
  age = sub.number();
  children = sub.array(Person);
}

// create a new person with sub.create()...
const person = sub.create(Person, {
  age: 52,
  children: [
    sub.create(Person, {
      age: 25,
      children: [],
    }),
  ],
});

function App() {
  // ...and subscribe via `useStruct(...)`
  let person = useStruct(person);

  // ...or create and subscribe via `useCreateStruct(...)`
  person = useCreateStruct(Person, {
    age: 52,
    children: [
      sub.create(Person, {
        age: 25,
        children: [],
      }),
    ],
  });

  return <Person person={person} />;
}

function Person(props: { person: Person }) {
  const person = useStruct(props.person);
  return (
    <div>
      age: {person.age}
      <button
        onClick={() => {
          const newPerson = sub.create(Person, {
            age: 30,
            children: [],
          });
          person.push(newPerson);
        }}
      >
        add child
      </button>
      children:
      <ul>
        {person.children.map((person) => {
          return <Person person={person} />;
        })}
      </ul>
    </div>
  );
}
```
