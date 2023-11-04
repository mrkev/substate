import React, { useEffect, useState } from "react";
import "./App.css";
import * as s from "./lib/sstate";
import { debugOut } from "./lib/sstate.debug";
import { globalState, popHistory, pushHistory } from "./lib/sstate.history";
import {
  useContainer,
  useSPrimitive,
  useSubToStruct,
} from "./lib/sstate.react";
import { construct, serialize } from "./lib/sstate.serialization";
import { useLinkedArray } from "./lib/state/LinkedArray";

/**
 * TODO:
 * - Redo
 * - Multiple types in array
 * - Smarter array history
 * - useHistory
 *    - returns [history, push, pop] ?
 *
 * TODO EVENTUALLY
 * - Test non-state primitives
 */

export class BusLine extends s.Struct<BusLine> {
  readonly distance = s.number();
  readonly stops = s.number();
  readonly buses = s.array([Bus]);

  addBus(name: string) {
    const lion = s.create2(Bus, { name });
    this.buses.push(lion);
  }

  clear() {
    pushHistory(() => {
      while (this.buses.pop()) {}
    });
  }
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
        <button onClick={() => popHistory()}>undo</button>
        <button onClick={() => popHistory()}>redo</button>
        <br></br>
        <CountButton name="distance" num={busLine.distance} />
        <CountButton name="stops" num={busLine.stops} />
        <br></br>
        <button
          onClick={() =>
            pushHistory(() => {
              busLine.addBus("hello world");
            })
          }
        >
          Add bus
        </button>
        <button
          onClick={() => {
            performance.mark("1");
            pushHistory(() => {
              for (let i = 0; i < 10000; i++) {
                busLine.addBus("hello world");
              }
            });
            performance.mark("2");
            performance.measure("Add 10000 items", "1", "2");
            console.log("Added 10000");
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
  const [tracks] = useContainer(busLine.buses);
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
        pushHistory(() => {
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
      pushHistory(() => {
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
          pushHistory(() => {
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
  useSubToStruct(busLine);
  const [history] = useLinkedArray(globalState.history);

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
              {i}, modified {entry.prevObjects.size} objects
            </summary>
            <pre style={{ textAlign: "left" }}>
              {Array.from(entry.prevObjects.entries()).map(([id, value]) => {
                return `${id}: ${JSON.stringify(JSON.parse(value), null, 2)}`;
              })}
            </pre>
          </details>
        );
      })}
    </div>
  );
}

export default App;

(window as any).project = busLine;
