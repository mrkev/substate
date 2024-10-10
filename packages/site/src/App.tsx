import hljs from "highlight.js";
import { useState } from "react";
import * as s from "../../structured-state/src/index";
import {
  DeserializeFunc,
  Structured,
  construct,
  debugOut,
  serialize,
  useContainer,
  useContainerWithSetter,
  useDirtyTracker,
} from "../../structured-state/src/index";
import { Serialized } from "../../structured-state/src/serialization";
import {
  HistoryEntry,
  getGlobalState,
  popHistory,
  recordHistory,
} from "../../structured-state/src/sstate.history";
import { LinkedArray } from "../../structured-state/src/state/LinkedArray";
import "./App.css";
import { SchedulerTest } from "./SchedulerTest";
import { Effect, MidiTrack, Note, TrackM } from "./structs/MidiTrack";

(window as any).s = s;

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

export class Project extends Structured<SerializedProject, typeof Project> {
  readonly name: s.SString;
  readonly tracks: s.SSchemaArray<MidiTrack>;
  readonly effects: s.SArray<Effect>;
  readonly randomNumbers: s.SSet<number>;

  constructor(name: string, clips?: MidiTrack[]) {
    super();
    this.name = s.string(name);
    this.tracks = s.arrayOf([MidiTrack], clips);
    this.effects = s.array<Effect>();
    // [["foo", 3]] // why does this print as unknown when empty?
    // TODO: it's bc it's unintialized
    this.randomNumbers = s.set();
  }

  override autoSimplify() {
    return {
      name: this.name,
      tracks: this.tracks,
      randomNumbers: this.randomNumbers,
    };
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
    return Structured.create(Project, json.name, clips);
  }

  addTrack(name: string) {
    const clip = s.create(MidiTrack, { counter: 3 });
    this.tracks.push(clip);
  }

  clear() {
    while (this.tracks.pop()) {}
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

  const [projectDirtyState, markProjectClean] = useDirtyTracker(project);

  return (
    <>
      <div>
        <SchedulerTest />
        useIsDirty: {JSON.stringify(projectDirtyState)}{" "}
        <button
          onClick={() => {
            markProjectClean();
          }}
        >
          save
        </button>
        <button onClick={() => popHistory()}>undo</button>
        <button onClick={() => s.history.redo()}>redo</button>
        <br></br>
        <button
          onClick={() =>
            recordHistory("add track", () => {
              project.addTrack("hello world");
            })
          }
        >
          Add Track
        </button>
        <button
          onClick={() => {
            const NUM = 1000;
            performance.mark("1");
            recordHistory(`add ${NUM} tracks`, () => {
              for (let i = 0; i < NUM; i++) {
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
            recordHistory("clear", () => {
              project.clear();
            });
          }}
        >
          remove all
        </button>
        <button
          onClick={() => {
            recordHistory("add random num", () => {
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
          <UProject project={project} />
        </fieldset>
        <HistoryStacks />
      </div>
    </>
  );
}

function UProject({ project }: { project: Project }) {
  const [tracks] = useContainerWithSetter(project.tracks);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {tracks.map((track) => {
        return <TrackM project={project} key={track._id} track={track} />;
      })}
    </div>
  );
}

export function Notes(props: { notes: LinkedArray<Note> }) {
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
                recordHistory("remove note", () => {
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
        {entry.name} ({entry.objects.size} objects)
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
