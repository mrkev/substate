import React, { useEffect, useState } from "react";
import * as Struct from "../Struct";
import * as s from "../sstate";
import { debugOut } from "../sstate.debug";
import { getGlobalState, popHistory, recordHistory } from "../sstate.history";
import { useContainer, useSPrimitive, useStructure } from "../sstate.react";
import { construct, serialize } from "../serialization";
import "./App.css";

export class BusLine extends Struct.Struct<BusLine> {
  readonly distance = s.number();
  readonly stops = s.number();
  readonly buses = s.arrayOf([Bus]);

  addBus(name: string) {
    const lion = Struct.create(Bus, { name });
    this.buses.push(lion);
  }

  clear() {
    recordHistory(() => {
      while (this.buses.pop()) {}
    });
  }
}

export class Bus extends Struct.Struct<Bus> {
  readonly name = s.string();
}

const busLine = Struct.create(BusLine, {
  distance: 0,
  stops: 0,
  buses: [Struct.create(Bus, { name: "hello" })],
});

export function App() {
  return (
    <>
      <div>
        <button onClick={() => popHistory()}>undo</button>
        <button onClick={() => popHistory()}>redo</button>
        <br></br>
        <CountButton name="distance" num={busLine.distance} />
        <CountButton name="stops" num={busLine.stops} />
        <br></br>
        <button
          onClick={() =>
            recordHistory(() => {
              busLine.addBus("hello world");
            })
          }
        >
          Add bus
        </button>
        <button
          onClick={() => {
            performance.mark("1");
            recordHistory(() => {
              for (let i = 0; i < 1000; i++) {
                busLine.addBus("hello world");
              }
            });
            performance.mark("2");
            performance.measure("Add 1000 items", "1", "2");
            console.log("Added 1000");
          }}
        >
          Add 100
        </button>
        <button
          onClick={() => {
            busLine.clear();
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
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ProjectDebug />
        <BusList />
      </div>
    </>
  );
}

function BusList() {
  const [tracks] = useStructure(busLine.buses);
  return (
    <div>
      {tracks.map((track) => {
        return <BusEditor tracks={tracks} key={track._id} track={track} />;
      })}
    </div>
  );
}

function CountButton({ num, name }: { num: s.SNumber; name: string }) {
  const [count, setCount] = useSPrimitive(num);
  return (
    <button
      onClick={() => {
        recordHistory(() => {
          setCount((prev) => prev + 1);
        });
      }}
    >
      {name} is {count}
    </button>
  );
}

const BusEditor = React.memo(function TrackAImpl({
  track,
  tracks,
}: {
  track: Bus;
  tracks: s.SArray<Bus>;
}) {
  const [name, setName] = useSPrimitive(track.name);
  const [edit, setEdit] = useState(name);

  useEffect(() => {
    setEdit(name);
  }, [name]);

  function commitEdit() {
    if (edit !== name) {
      recordHistory(() => {
        setName(edit);
      });
    }
  }

  return (
    <div>
      <input
        type="text"
        value={edit}
        onChange={(e) => setEdit(e.target.value)}
        onBlur={() => commitEdit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitEdit();
          }
        }}
      ></input>
      <button
        onClick={() =>
          recordHistory(() => {
            tracks.remove(track);
          })
        }
      >
        x
      </button>
    </div>
  );
});

function ProjectDebug() {
  useContainer(busLine);
  const history = useContainer(getGlobalState().history);

  return (
    <div>
      <pre style={{ textAlign: "left", width: 300 }}>{debugOut(busLine)}</pre>
      {/* <button
        onClick={() => {
          setState({});
        }}
      >
        refresh {globalState.history.length}
      </button> */}
      {history.map((entry, i) => {
        return (
          <details key={i}>
            <summary>
              {i}, modified {entry.objects.size} objects
            </summary>
            <pre style={{ textAlign: "left" }}>
              {Array.from(entry.objects.entries()).map(([id, value]) => {
                return `${id}: ${JSON.stringify(JSON.parse(value), null, 2)}`;
              })}
            </pre>
          </details>
        );
      })}
    </div>
  );
}

(window as any).project = busLine;
