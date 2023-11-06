import { types } from "mobx-state-tree";
import { nanoid } from "nanoid";

const Bus = types.model({
  name: types.string,
  id: types.string,
});

const BusLine = types
  .model({
    distance: 0,
    stops: 0,
    buses: types.array(Bus),
  })
  .actions((self) => ({
    addBus(name: string) {
      self.buses.push({ name, id: nanoid(5) });
    },
  }));

const store = BusLine.create();

export function MSTTest() {
  return (
    <>
      <div>
        <button
          onClick={() => {
            performance.mark("1");
            for (let i = 0; i < 10000; i++) {
              store.addBus("hello world");
            }
            performance.mark("2");
            performance.measure("Add 10000 items", "1", "2");
            console.log("ADDED 10000");
          }}
        >
          Add 100
        </button>
      </div>
    </>
  );
}
