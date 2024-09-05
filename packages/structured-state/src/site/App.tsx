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
import { Serialized } from "../serialization";
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
  readonly clips: s.SSchemaArray<MidiTrack>;
  readonly effects: s.SArray<Effect>;
  readonly randomNumbers: s.SSet<number>;

  constructor(name: string, clips?: MidiTrack[]) {
    super();
    this.name = s.string(name);
    this.clips = s.arrayOf([MidiTrack], clips);
    this.effects = s.array<Effect>();
    // [["foo", 3]] // why does this print as unknown when empty?
    // TODO: it's bc it's unintialized
    this.randomNumbers = s.set();
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
        ? deserializeWithSchema(json.tracks ?? [], MidiTrack)._getRaw()
        : undefined;
    return new Project(json.name, clips);
  }

  addTrack(name: string) {
    const clip = s.create(MidiTrack, { counter: 3 });
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
  public counter: number;

  constructor(props: s.StructProps<Track, { counter: number }>) {
    super(props);
    this.counter = props.counter;
  }
}

class MidiTrack extends Track {
  readonly name = s.string();
  public notes = s.array<Note>([
    [1, 1],
    [1, 2],
  ]);

  addNote(note: Note) {
    this.notes.push(note);
  }
}

function App() {
  const [project, setProject] = useState(() => {
    const result = Structured.create(Project, "untitled track", [
      s.create(MidiTrack, { counter: 3 }),
    ]);
    (window as any).project = result;
    return result;
  });

  const dirty = useIsDirty(project);

  return (
    <>
      <div>
        useIsDirty: {JSON.stringify(dirty)}{" "}
        <button
          onClick={() => {
            project._markClean();
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
              project.addTrack("hello world");
            })
          }
        >
          Add Track
        </button>
        <button
          onClick={() => {
            performance.mark("1");
            recordHistory(() => {
              for (let i = 0; i < 1000; i++) {
                project.addTrack("hello world");
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
            recordHistory(() => {
              project.clear();
            });
          }}
        >
          remove all
        </button>
        <button
          onClick={() => {
            recordHistory(() => {
              project.randomNumbers.add(Math.random());
            });
          }}
        >
          add random num
        </button>
        <button
          onClick={() => {
            const serialized = serialize(project);
            console.log("serialized", serialized);
            const constructed = construct(serialized, Project);
            console.log("constructed", constructed);
            // setProject(constructed as any);
          }}
        >
          construct test
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexGrow: 1 }}>
        <ProjectDebug project={project} />

        <fieldset
          style={{
            border: "none",
            background: "#181818",
            alignSelf: "flex-start",
          }}
        >
          <legend>Project</legend>
          <TrackClips project={project} />
        </fieldset>
        <HistoryStacks />
      </div>
    </>
  );
}

function TrackClips({ project }: { project: Project }) {
  const [clips] = useContainerWithSetter(project.clips);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {clips.map((track) => {
        return <ClipA tracks={clips} key={track._id} clip={track} />;
      })}
    </div>
  );
}

const ClipA = React.memo(function TrackAImpl({
  clip,
  tracks,
}: {
  clip: MidiTrack;
  tracks: s.SArray<MidiTrack>;
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

      {clip.counter}

      <input
        type="button"
        value={"+"}
        onClick={() =>
          recordHistory(() => {
            clip.featuredMutation(() => {
              clip.counter += 1;
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

function ProjectDebug({ project }: { project: Project }) {
  useContainer(project, true);

  const value = hljs.highlight(debugOut(project), {
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
