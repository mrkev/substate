import hljs from "highlight.js";
import { useState } from "react";
import * as s from "../../structured-state/src/index";
import {
  construct,
  debugOut,
  serialize,
  useContainer,
  useContainerWithSetter,
  useDirtyTracker,
} from "../../structured-state/src/index";
import {
  HistoryEntry,
  getGlobalState,
  recordHistory,
} from "../../structured-state/src/sstate.history";
import { LinkedArray } from "../../structured-state/src/state/LinkedArray";
import "./App.css";
import { SchedulerTest } from "./SchedulerTest";
import { AudioClip } from "./structs/AudioClip";
import { AudioTrack } from "./structs/AudioTrack";
import { Note } from "./structs/MidiTrack";
import { Project } from "./structs/Project";
import { TrackA } from "./ui/TrackA";
import { nullthrows } from "./util";
import { setWindow } from "../../structured-state/src/nullthrows";

setWindow("s", s);

/**
 * TODO:
 * x Redo
 * x Dirty marker
 * - built-in clone for structs. In theory easy, since I already serialize/decerialize and that captures all the props I care about
 * - Multiple types in array?
 * x Smarter array history?
 * x sarray history
 * x put all history in global state in one object (history.undo/pop/redo/push, etc)
 * - Make isDirty work better with undo (undo to save state makes isDirty = false)
 */

export function App() {
  const [project] = useState(() => {
    const result = Project.of(
      "untitled track",
      [
        AudioTrack.of("track 1", [AudioClip.of(0, 4)]),
        AudioTrack.of("track 2", []),
      ],
      [
        [0, "foo"],
        [1, "bar"],
      ]
    );
    setWindow("project", result);
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
        <button onClick={() => s.history.undo()}>undo</button>
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
          <button
            onClick={() => {
              s.history.record("move clip", () => {
                const track0 = nullthrows(project.tracks.at(0));
                const track1 = nullthrows(project.tracks.at(1));
                const clip = nullthrows(track0.clips.at(0));

                clip.timelineStart.set(4);
                track0.clips.remove(clip);
                track1.clips.push(clip);

                // works if:
                // track0.clips.remove(clip);
                // clip.timelineStart.set(4);
                // track1.clips.push(clip);
              });
            }}
          >
            move clip and change time
          </button>
          <UProject project={project} />
        </fieldset>
        <HistoryStacks />
      </div>
    </>
  );
}

function UProject({ project }: { project: Project }) {
  const [tracks] = useContainerWithSetter(project.tracks);
  const markers = useContainer(project.markers);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div>
        {markers.map(String).join(",")}
        <button
          onClick={() => {
            s.history.record("add marker", () => {
              markers.push([0, "foo"]);
              console.log("pushed");
            });
          }}
        >
          +
        </button>
      </div>
      {tracks.map((track) => {
        return <TrackA project={project} key={track._id} track={track} />;
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
