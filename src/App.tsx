import React, { useEffect, useState } from "react";
import "./App.css";

import * as s from "./lib/sstate";
import { useContainer, useSPrimitive } from "./lib/sstate.react";
import { construct, serialize } from "./lib/sstate.serialization";
import { MutationHashable } from "./lib/state/MutationHashable";
import { subscribe } from "./lib/state/Subbable";

export class BusLine extends s.Struct<BusLine> {
  readonly distance = s.number();
  readonly stops = s.number();
  readonly buses = s.array([Bus]);

  addBus(name: string) {
    const lion = s.create2(Bus, { name });
    this.buses.push(lion);
  }

  // clear() {
  //   while (this.buses.pop()) {}
  // }
}

export class Bus extends s.Struct<Bus> {
  readonly name = s.string();
}

const busLine = s.create2(BusLine, {
  distance: 0,
  stops: 0,
  buses: [s.create2(Bus, { name: "hello" })],
});

function App() {
  return (
    <>
      <div>
        <CountButton num={busLine.distance} />
        <CountButton num={busLine.stops} />
        <button onClick={() => busLine.addBus("hello world")}>Add bus</button>
        {/* <button
          onClick={() => {
            for (let i = 0; i < 100; i++) {
              busLine.addBus("hello world");
            }
          }}
        >
          Add 100
        </button>
        <button
          onClick={() => {
            for (let i = 0; i < 100; i++) {
              busLine.clear();
            }
          }}
        >
          remove all
        </button>
        <button
          onClick={() => {
            const serialized = serialize(busLine);
            console.log("serialized", serialized);
            console.log("constructed", construct(serialized, BusLine));
          }}
        >
          construct test
        </button> */}
      </div>
      <BusList />
      <ProjectDebug />
    </>
  );
}

function BusList() {
  const [tracks] = useContainer(busLine.buses);
  return (
    <div>
      hello
      {tracks.map((track) => {
        return <TrackA tracks={tracks} key={track._id} track={track} />;
      })}
    </div>
  );
}

function CountButton({ num }: { num: s.SNumber }) {
  const [count, setCount] = useSPrimitive(num);
  return (
    <button
      onClick={() => {
        setCount((prev) => prev + 1);
      }}
    >
      count is {count}
    </button>
  );
}

const TrackA = React.memo(function TrackAImpl({
  track,
  tracks,
}: {
  track: Bus;
  tracks: s.SArray<Bus>;
}) {
  const [name, setName] = useSPrimitive(track.name);

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      ></input>
      <button onClick={() => tracks.remove(track)}>x</button>
    </div>
  );
});

function ProjectDebug() {
  useSubToStruct(busLine);
  return <pre style={{ textAlign: "left" }}>{busLine.serialize()}</pre>;
}

export default App;

(window as any).project = busLine;

function useSubToStruct<S extends s.Struct<any>>(obj: S) {
  const [, setHash] = useState(() => MutationHashable.getMutationHash(obj));

  useEffect(() => {
    return subscribe(obj, () => {
      setHash((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
    });
  }, [obj]);

  return obj;
}
