import React, { useEffect, useState } from "react";
import * as s from "../index";
import { useContainer, usePrimitive, useContainerWithSetter } from "../index";
import { LinkedArray, useLinkedArray } from "../lib/state/LinkedArray";
import {
  HistoryEntry,
  getGlobalState,
  popHistory,
  recordHistory,
} from "../sstate.history";
import { construct, serialize, debugOut } from "../index";
import "./App.css";

/**
 * TODO:
 * - Redo
 * - Multiple types in array
 * - Smarter array history?
 * - useHistory
 *    - returns [history, push, pop] ?
 * - put all history in global state in one object (history.undo/pop/redo/push, etc)
 * - built-in clone for structs. In theory easy, since I already serialize/decerialize and that captures all the props I care about
 */

export class Track extends s.Struct<Track> {
  readonly name = s.string();
  readonly clips = s.arrayOf([MidiClip]);
  readonly effects = s.array<Effect>();

  addClip(name: string) {
    const clip = s.create(MidiClip, { name, duration: 3 });
    this.clips.push(clip);
  }

  clear() {
    while (this.clips.pop()) {}
  }
}

type Note = readonly [s: number, e: number];
type Effect = readonly [name: string, value: number];

export class Clip extends s.Struct<Clip> {
  readonly name = s.string();
  public start: number = 0;
  public duration: number;

  constructor(props: s.StructProps<Clip, { duration: number }>) {
    super(props);
    this.duration = props.duration;
  }
}

class MidiClip extends Clip {
  public notes = s.array<Note>([
    [1, 1],
    [1, 2],
  ]);

  addNote(note: Note) {
    this.notes.push(note);
  }
}

const track = s.create(Track, {
  name: "untitled track",
  clips: [s.create(MidiClip, { duration: 3, name: "foo" })],
});

function App() {
  return (
    <>
      <div>
        <button onClick={() => popHistory()}>undo</button>
        <br></br>
        <button
          onClick={() =>
            recordHistory(() => {
              track.addClip("hello world");
            })
          }
        >
          Add clip
        </button>
        <button
          onClick={() => {
            performance.mark("1");
            recordHistory(() => {
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
            recordHistory(() => {
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
      <div style={{ display: "flex", flexDirection: "row", flexGrow: 1 }}>
        <ProjectDebug />
        <TrackClips />
        <HistoryStacks />
      </div>
    </>
  );
}

function TrackClips() {
  const [tracks] = useContainerWithSetter(track.clips);
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
  clip: MidiClip;
  tracks: s.SArray<MidiClip>;
}) {
  const [name, setName] = usePrimitive(clip.name);
  const [edit, setEdit] = useState(name);

  useContainer(clip);

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
          recordHistory(() => {
            tracks.remove(clip);
          })
        }
      >
        x
      </button>
      <button
        onClick={() =>
          recordHistory(() => {
            clip.featuredMutation(() => {
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
                recordHistory(() => {
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
  return (
    <div style={{ overflow: "scroll" }}>
      <pre style={{ textAlign: "left", width: 300, fontSize: 12 }}>
        {debugOut(track)}
      </pre>
    </div>
  );
}

function HistoryStacks() {
  const [history] = useLinkedArray(getGlobalState().history);
  const [redoStack] = useLinkedArray(getGlobalState().redoStack);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {history.map((entry, i) => {
        return <HistoryItem entry={entry} key={i} />;
      })}
      <div>^ undo / v redo</div>
      {redoStack.map((entry, i) => {
        return <HistoryItem entry={entry} key={i} />;
      })}
    </div>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  return (
    <details>
      <summary>
        {entry.id} modified {entry.objects.size} objects
      </summary>
      <pre style={{ textAlign: "left" }}>
        {Array.from(entry.objects.entries()).map(([id, value]) => {
          return `${id}: ${JSON.stringify(JSON.parse(value), null, 2)}`;
        })}
      </pre>
    </details>
  );
}

export default App;

(window as any).project = track;
