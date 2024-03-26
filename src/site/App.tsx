import hljs from "highlight.js";
import React, { useEffect, useState } from "react";
import { DeserializeFunc, Structured } from "../Structured";
import * as s from "../index";
import {
  construct,
  debugOut,
  serialize,
  useContainer,
  useContainerWithSetter,
  usePrimitive,
} from "../index";
import { LinkedArray } from "../lib/state/LinkedArray";
import {
  HistoryEntry,
  getGlobalState,
  popHistory,
  recordHistory,
} from "../sstate.history";
import { useIsDirty } from "../sstate.react";
import { Serialized } from "../sstate.serialization";
import "./App.css";

/**
 * TODO:
 * - Redo
 * x Dirty marker
 * - Multiple types in array?
 * - Smarter array history?
 * - useHistory
 *    - returns [history, push, pop] ?
 * x put all history in global state in one object (history.undo/pop/redo/push, etc)
 * - built-in clone for structs. In theory easy, since I already serialize/decerialize and that captures all the props I care about
 * - Make isDirty work better with undo (undo to save state makes isDirty = false)
 */

type SerializedProject = Readonly<{
  name: string;
  tracks?: Extract<Serialized, { $$: "arr-schema" }>; // todo this is not working for some reason:
  // clips?: ApplySerialization<s.SSchemaArray<MidiClip>>;
}>;

class Project extends Structured<SerializedProject, typeof Project> {
  readonly name: s.SString;
  readonly clips: s.SSchemaArray<MidiClip>;
  readonly effects: s.SArray<Effect>;

  constructor(name: string, clips?: MidiClip[]) {
    super();
    this.name = s.string(name);
    this.clips = s.arrayOf([MidiClip], clips);
    this.effects = s.array<Effect>();
  }

  override serialize() {
    // TODO: HOW TO SERIALIZE CLIPS
    return { name: this.name.get() } as const;
  }

  override replace(json: SerializedProject): void {
    this.name.set(json.name);
    // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
    // this.clips._setRaw(json.clips)
  }

  static construct(
    json: SerializedProject,
    deserializeWithSchema: DeserializeFunc
  ) {
    // TODO: asnync constructs
    const clips =
      json.tracks != null
        ? deserializeWithSchema(json.tracks ?? [], MidiClip)._getRaw()
        : undefined;
    return new Project(json.name, clips);
  }

  addClip(name: string) {
    const clip = s.create(MidiClip, { duration: 3 });
    this.clips.push(clip);
  }

  clear() {
    while (this.clips.pop()) {}
  }
}

type Note = readonly [s: number, e: number];
type Effect = readonly [name: string, value: number];

export class Track extends s.Struct<Track> {
  // public name: string = "untitled track";
  public duration: number;

  constructor(props: s.StructProps<Track, { duration: number }>) {
    super(props);
    this.duration = props.duration;
  }
}

class MidiClip extends Track {
  readonly name = s.string();
  public notes = s.array<Note>([
    [1, 1],
    [1, 2],
  ]);

  addNote(note: Note) {
    this.notes.push(note);
  }
}

const track = Structured.create(Project, "untitled track", [
  s.create(MidiClip, { duration: 3 }),
]);

function App() {
  const dirty = useIsDirty(track);

  return (
    <>
      <div>
        useIsDirty: {JSON.stringify(dirty)}{" "}
        <button
          onClick={() => {
            track._markClean();
          }}
        >
          save
        </button>
        <button onClick={() => popHistory()}>undo</button>
        <button onClick={() => s.history.redo()}>redo</button>
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
            console.log("constructed", construct(serialized, Project));
          }}
        >
          construct test
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexGrow: 1 }}>
        <ProjectDebug />

        <fieldset
          style={{
            border: "none",
            background: "#181818",
            alignSelf: "flex-start",
          }}
        >
          <legend>Track</legend>
          <TrackClips />
        </fieldset>
        <HistoryStacks />
      </div>
    </>
  );
}

function TrackClips() {
  const [tracks] = useContainerWithSetter(track.clips);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
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
    <fieldset>
      <legend>
        {clip.constructor.name}{" "}
        <input
          type="text"
          value={edit ?? ""}
          placeholder="name"
          onChange={(e) => setEdit(e.target.value)}
          onBlur={() => commitEdit()}
          style={{ width: "10ch" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitEdit();
            }
          }}
        />{" "}
        <input
          type="button"
          value={"x"}
          onClick={() =>
            recordHistory(() => {
              tracks.remove(clip);
            })
          }
        ></input>
      </legend>

      {clip.duration}

      <input
        type="button"
        value={"+"}
        onClick={() =>
          recordHistory(() => {
            clip.featuredMutation(() => {
              clip.duration += 1;
            });
          })
        }
      ></input>
      <Notes notes={clip.notes} />
    </fieldset>
  );
});

function Notes(props: { notes: LinkedArray<Note> }) {
  const notes = useContainer(props.notes);

  return (
    <ul style={{ textAlign: "left" }}>
      {notes.map((note, i) => {
        return (
          <li key={i}>
            {JSON.stringify(note)}
            <input
              type="button"
              value={"x"}
              onClick={() => {
                recordHistory(() => {
                  notes.remove(note);
                });
              }}
            ></input>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectDebug() {
  useContainer(track, true);

  const value = hljs.highlight(debugOut(track), {
    language: "javascript",
  }).value;
  return (
    <div style={{ overflow: "scroll" }}>
      <pre
        style={{ textAlign: "left", width: 300, fontSize: 12 }}
        dangerouslySetInnerHTML={{ __html: value }}
      >
        {/* {debugOut(track)} */}
      </pre>
    </div>
  );
}

function HistoryStacks() {
  const history = useContainer(getGlobalState().history);
  const redoStack = useContainer(getGlobalState().redoStack);

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
