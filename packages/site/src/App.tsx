import hljs from "highlight.js";
import { useState } from "react";
import * as s from "../../structured-state/src/index";
import {
  construct,
  debugOut,
  serialize,
  useContainer,
  useDirtyTracker,
} from "../../structured-state/src/index";

import { setWindow } from "../../structured-state/src/lib/nullthrows";
import {
  HistorySnapshot,
  getGlobalState,
  recordHistory,
} from "../../structured-state/src/sstate.history";
import { LinkedArray } from "../../structured-state/src/state/LinkedArray";
import { AudioClip } from "./structs/AudioClip";
import { AudioTrack } from "./structs/AudioTrack";
import { Note } from "./structs/MidiTrack";
import { Project } from "./structs/Project";
import { TrackA } from "./ui/TrackA";
import { SchedulerTest } from "./unused/SchedulerTest";
import { nullthrows } from "./util";

setWindow("s", s);

/**
 * TODO:
 * - reference kind, serializes as id, looks in map when initializng. good for children to point to parents.
 * x Redo
 * x Dirty marker
 * - serialization when two containers point to the same object
 * - SPrimitive only holds non-structs. SUnion only holds structs. SPrimitive requests a serialization function, and SString, SNumber, etc are automatic
 *  - we need this cause I can put anything in sprimitive rn, and it causes issues when serializing.
 * x built-in clone for structs. In theory easy, since I already serialize/decerialize and that captures all the props I care about
 *    // not doing this, to allow users control over clone, for example, to allow some non-structured state to be shared
 * - Multiple types in array?
 * - faster array history
 *  - history for arrays just saves the whole array, which can get very slow, especially on wide or deep structures.
 *    > we want to only record delete/add operations, and only save the items that were deleted, or record what items were added.
 *    > note that edits will be handled at the object-level when they happen. we only want to record array-level changes, so delete/add should be enough.
 *    > we can get cheeky and support "reposition", for .sort too.
 * - async history, should be doable. if recordHistory gets called within another recordHistory, just defer its execution until the first one is done?
 * x Smarter array history?
 * x sarray history
 * x put all history in global state in one object (history.undo/pop/redo/push, etc)
 * - Make isDirty work better with undo (undo to save state makes isDirty = false)
 * - how to serialize elements contained by multiple parents? serialized format is element map and {_ref} to ids?
 * - map serialization, history
 *
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
            const serialized = serialize(project);
            console.log("serialized", serialized);
            console.log("serialized", JSON.parse(serialized));
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
  const tracks = useContainer(project.tracks);
  const randomNumbers = useContainer(project.randomNumbers);
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
        Set: {randomNumbers.size}
        <button
          title="add random num"
          onClick={() => {
            recordHistory("add random num", () => {
              project.randomNumbers.add(Math.random());
            });
          }}
        >
          +
        </button>
      </div>
      <div>
        SArray: {markers.map(String).join(",")}
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

function HistoryItem({ entry }: { entry: HistorySnapshot }) {
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
