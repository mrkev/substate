import React, { useEffect, useState } from "react";
import * as s from "../index";
import { useContainer, usePrimitive, useStructure } from "../index";
import { LinkedArray, useLinkedArray } from "../lib/state/LinkedArray";
import { debugOut } from "../sstate.debug";
import { getGlobalState, popHistory, pushHistory } from "../sstate.history";
import { construct, serialize } from "../sstate.serialization";
import "./App.css";

/**
 * TODO:
 * - Redo
 * - Multiple types in array
 * - Smarter array history
 * - useHistory
 *    - returns [history, push, pop] ?
 * - history for strcuts means recording when a prop changes
 * - I can use it with clips, for exmaple
 * - Clips can be structs, super.updated() trigers update?
 *
 * TODO EVENTUALLY
 * - Test non-state primitives
 */

export class Track extends s.Struct<Track> {
  readonly name = s.string();
  readonly clips = s.arrayOf([Clip]);

  addClip(name: string) {
    const clip = s.create(Clip, { name, duration: 3, notes: [] });
    this.clips.push(clip);
  }

  clear() {
    while (this.clips.pop()) {}
  }
}

type Note = readonly [s: number, e: number];

export class Clip extends s.Struct<Clip> {
  readonly name = s.string();
  public start: number = 0;
  public duration: number;
  public notes = s.array<Note>([
    [1, 1],
    [1, 2],
  ]);

  constructor(props: s.StructProps<Clip, { duration: number }>) {
    super(props);
    this.duration = props.duration;
  }

  addNote(note: Note) {
    this.notes.push(note);
  }
}

const track = s.create(Track, {
  name: "untitled track",
  clips: [s.create(Clip, { name: "hello", duration: 3, notes: [] })],
});

function App() {
  return (
    <>
      <div>
        <button onClick={() => popHistory()}>undo</button>
        <br></br>
        <button
          onClick={() =>
            pushHistory(() => {
              track.addClip("hello world");
            })
          }
        >
          Add clip
        </button>
        <button
          onClick={() => {
            performance.mark("1");
            pushHistory(() => {
              for (let i = 0; i < 10000; i++) {
                track.addClip("hello world");
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
            pushHistory(() => {
              track.clear();
            });
          }}
        >
          remove all
        </button>
        <button
          onClick={() => {
            const serialized = serialize(track);
            console.log("serialized", serialized);
            console.log("constructed", construct(serialized, Track));
          }}
        >
          construct test
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ProjectDebug />
        <TrackClips />
      </div>
    </>
  );
}

function TrackClips() {
  const [tracks] = useStructure(track.clips);
  return (
    <div>
      {tracks.map((track) => {
        return <ClipA tracks={tracks} key={track._id} clip={track} />;
      })}
    </div>
  );
}

const ClipA = React.memo(function TrackAImpl({
  clip,
  tracks,
}: {
  clip: Clip;
  tracks: s.SArray<Clip>;
}) {
  const [name, setName] = usePrimitive(clip.name);
  const [edit, setEdit] = useState(name);

  useContainer(clip);

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
    <div style={{ border: "1px solid black" }}>
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
      {clip.duration}
      <button
        onClick={() =>
          pushHistory(() => {
            tracks.remove(clip);
          })
        }
      >
        x
      </button>
      <button
        onClick={() =>
          pushHistory(() => {
            clip.mutate(() => {
              clip.duration += 1;
            });
          })
        }
      >
        +
      </button>
      <Notes notes={clip.notes} />
    </div>
  );
});

function Notes(props: { notes: LinkedArray<Note> }) {
  const [notes] = useLinkedArray(props.notes);

  return (
    <div>
      {notes.map((note, i) => {
        return (
          <div key={i}>
            {note}
            <button
              onClick={() => {
                pushHistory(() => {
                  notes.remove(note);
                });
              }}
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ProjectDebug() {
  useContainer(track, true);
  const [history] = useLinkedArray(getGlobalState().history);

  return (
    <div>
      <pre style={{ textAlign: "left", width: 300 }}>{debugOut(track)}</pre>
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
              {entry.id} modified {entry.prevObjects.size} objects
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

(window as any).project = track;
