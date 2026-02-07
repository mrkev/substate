import {
  MarkedSerializable,
  SerializationMark,
  SimplifiedPackage,
  consolidateMarks,
  constructSimplifiedPackage,
  simplifyAndPackage,
} from "@mrkev/marked-serializable";
import { useLink } from "@mrkev/marked-subbable";
import { useState } from "react";
import { nullthrows, setWindow } from "../../../linked-state/src/nullthrows";
import { UtilityToggle } from "../UtilityToggle";
import {
  MAudioClip,
  serialization_maudioclip as MAudioClip_serializationMark,
  serialization_maudioclip,
} from "./MAudioClip";
import { MAudioTrack, serialization_maudiotrack } from "./MAudioTrack";
import { MProject, serialization_mproject } from "./MProject";
import { MProjectDebug } from "./MProjectDebug";
import { serialization_mtime } from "./MTime";
import { historyStackFor } from "./exp/historyStackFor";

const project = MProject.of(
  "untitled project",
  [
    MAudioTrack.of("track 1", [MAudioClip.of(0, 4)]),
    MAudioTrack.of("track 2", []),
  ],
  [
    [0, "foo"],
    [1, "bar"],
  ],
);

const serializationIndex = consolidateMarks([
  serialization_mtime,
  serialization_maudioclip,
  serialization_maudiotrack,
  serialization_mproject,
]);

const history = historyStackFor(project, serializationIndex);

setWindow("project", project);
setWindow("mhistory", history);

function recordHistory(name: string, cb: () => void) {
  return cb();
}

function serialize(x: MarkedSerializable<any>) {
  return simplifyAndPackage(x);
}
function construct(x: SimplifiedPackage, index: SerializationMark<any, any>) {
  return constructSimplifiedPackage(x, serializationIndex);
}

export function MarkedProjectTest() {
  // const [projectDirtyState, markProjectClean] = useDirtyTracker(project);

  return (
    <>
      <div className="flex flex-row gap-2 justify-center">
        <button
          className="px-1"
          onClick={() => {
            const serialized = serialize(project);
            console.log("serialized", JSON.parse(JSON.stringify(serialized)));
            const constructed = construct(
              serialized,
              MAudioClip_serializationMark,
            );
            console.log("og vs constructed", project, constructed);
          }}
        >
          construct test
        </button>
        <button
          className="px-1"
          onClick={() => {
            const serialized = serialize(project);
            console.log("should save", serialized);
          }}
        >
          save
        </button>

        <button
          className="px-1"
          onClick={() => {
            history.pop();
          }}
        >
          undo
        </button>
      </div>
      <div className="flex flex-row gap-2 grow font-mono">
        <MProjectDebug project={project} />

        <fieldset
          className="border-none"
          style={{
            background: "#181818",
            alignSelf: "flex-start",
          }}
        >
          <legend>Project</legend>
          <UProject project={project} />
        </fieldset>
      </div>

      <Changelog mproject={project} />
    </>
  );
}

function Changelog({ mproject }: { mproject: MProject }) {
  "use no memo";
  const project = useLink(mproject, true);
  // console.log("changed", project());
  return null;
}

function UProject({ project }: { project: MProject }) {
  const tracks = useLink(project.tracks);
  const randomNumbers = useLink(project.randomNumbers);
  const markers = useLink(project.markers);
  return (
    <div className="p-1 flex flex-row gap-2">
      <div className="p-1 flex flex-col gap-2 min-w-50">
        <div>
          MarkedSet: {randomNumbers().size}
          <button
            title="add random num"
            onClick={() => {
              project.randomNumbers.add(Math.random());
              history.checkpoint("add random num");

              // recordHistory("add random num", () => {
              //   project.randomNumbers.add(Math.random());
              // });
            }}
          >
            +
          </button>
        </div>
        <div>
          MarkedArray:{" "}
          <button
            onClick={() => {
              recordHistory("add marker", () => {
                markers().set(Math.random(), "foo");
                console.log("pushed");
              });
            }}
          >
            +
          </button>
          <br />
          {markers().map((val, key) => (
            <span key={key}>
              {key}: {val}
              <br />
            </span>
          ))}
        </div>
      </div>
      <div className="p-1 flex flex-col gap-2">
        Tracks
        <div>
          <input
            type="button"
            value={"move clip and change time"}
            onClick={() => {
              recordHistory("move clip", () => {
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
          />
        </div>
        <div>
          <input
            type="button"
            value={"add track"}
            onClick={() =>
              recordHistory("add track", () => {
                project.addTrack("hello world");
              })
            }
          />{" "}
          <input
            type="button"
            value={"add 1000"}
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
          />{" "}
          <input
            type="button"
            value={"del all"}
            onClick={() => {
              recordHistory("clear", () => {
                project.clear();
              });
            }}
          />
        </div>
        <hr className="w-full" />
        {tracks().map((track) => {
          return (
            <TrackA project={project} key={track.$$mark._id} track={track} />
          );
        })}
      </div>
    </div>
  );
}

// export function Notes(props: { notes: LinkedArray<Note> }) {
//   const notes = useContainer(props.notes);

//   return (
//     <ul style={{ textAlign: "left" }}>
//       {notes.map((note, i) => {
//         return (
//           <li key={i}>
//             {JSON.stringify(note)}
//             <input
//               type="button"
//               value={"x"}
//               onClick={() => {
//                 recordHistory("remove note", () => {
//                   notes.remove(note);
//                 });
//               }}
//             ></input>
//           </li>
//         );
//       })}
//     </ul>
//   );
// }

export function TrackA({
  track,
  project,
}: {
  track: MAudioTrack;
  project: MProject;
}) {
  const name = useLink(track.name);
  const [edit, setEdit] = useState(name().get());
  const clips = useLink(track.clips);
  const solodTracks = useLink(project.solodTracks);

  // todo: need this?
  // useContainer(track);

  // todo: need this?
  // useEffect(() => {
  //   setEdit(name);
  // }, [name]);

  function commitEdit() {
    if (edit !== name().get()) {
      recordHistory("set name", () => {
        name().set(edit);
      });
    }
  }

  return (
    <fieldset className="flex flex-col gap-2 p-2 border border-gray-700">
      <legend>
        {track.constructor.name}{" "}
        <input
          className="w-[10ch]"
          type="text"
          value={edit ?? ""}
          placeholder="name"
          onChange={(e) => setEdit(e.target.value)}
          onBlur={() => commitEdit()}
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
            recordHistory("remove track", () => {
              project.tracks.remove(track);
            })
          }
        />
      </legend>
      <UtilityToggle
        className="self-start"
        style={{
          background: solodTracks().has(track) ? "yellow" : undefined,
        }}
        onToggle={() => {
          if (solodTracks().has(track)) {
            solodTracks().delete(track);
          } else {
            solodTracks().add(track);
          }
        }}
        toggled={solodTracks().has(track)}
      >
        {" solo "}
      </UtilityToggle>
      {clips().map((clip, i) => {
        return (
          <ClipA
            key={i}
            clip={clip}
            onRemove={function (): void {
              recordHistory("remove clip", () => {
                track.clips.remove(clip);
              });
            }}
          />
          // <li key={i}>
          //   <input
          //     type="button"
          //     value={"x"}
          //     onClick={() => {
          //       // recordHistory("remove note", () => {
          //       //   notes.remove(note);
          //       // });
          //     }}
          //   ></input>
          // </li>
        );
      })}
      <button
        style={{ background: "#333" }}
        onClick={() => clips().push(MAudioClip.of(0, 0))}
      >
        +
      </button>
    </fieldset>
  );
}

export function ClipA({
  clip,
  onRemove,
}: {
  clip: MAudioClip;
  onRemove: () => void;
}) {
  const timelineStart = useLink(clip.timelineStart);
  const timelineLength = useLink(clip.timelineLength);
  const { t: st, u: su } = timelineStart();
  const { t: lt, u: lu } = timelineLength();

  return (
    <fieldset className="bg-gray-800">
      <legend className="flex flex-row text-left w-full justify-between">
        {clip.constructor.name}
        <button onClick={onRemove}>x</button>
      </legend>
      <button onClick={() => timelineStart().set(st - 1)}>-</button> {st} {su}{" "}
      <button onClick={() => timelineStart().set(st + 1)}>+</button>
      <br />
      <button onClick={() => timelineLength().set(lt - 1)}>-</button> {lt} {lu}{" "}
      <button onClick={() => timelineLength().set(lt + 1)}>+</button>
    </fieldset>
  );
}
