import { useState } from "react";
import { nullthrows, setWindow } from "../../../linked-state/src/nullthrows";
import { useLink } from "../../../subbable-state/index";
import { UtilityToggle } from "../UtilityToggle";
import { MAudioClip, MAudioTrack, MProject } from "./MProject";
import { MProjectDebug } from "./MProjectDebug";

const project = MProject.of(
  "untitled project",
  [
    MAudioTrack.of("track 1", [MAudioClip.of(0, 4)]),
    MAudioTrack.of("track 2", []),
  ],
  [
    [0, "foo"],
    [1, "bar"],
  ]
);

setWindow("project", project);

function recordHistory(name: string, cb: () => void) {
  return cb();
}

export function MarkedProjectTest() {
  // const [projectDirtyState, markProjectClean] = useDirtyTracker(project);

  return (
    <>
      {/* <div>
        <button
          onClick={() => {
            recordHistory("clear", () => {
              project.clear();
            });
          }}
        >
          remove all
        </button>
      </div> */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          gap: 8,
          fontFamily: "monospace",
        }}
      >
        <MProjectDebug project={project} />

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
      </div>
    </>
  );
}

function UProject({ project }: { project: MProject }) {
  const tracks = useLink(project.tracks);
  const randomNumbers = useLink(project.randomNumbers);
  const markers = useLink(project.markers);
  return (
    <div className="p-1 flex flex-row gap-2">
      <div className="p-1 flex flex-col gap-2" style={{ minWidth: 200 }}>
        <div>
          MarkedSet: {randomNumbers().size}
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
            recordHistory("remove clip", () => {
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
          <ClipA key={i} clip={clip} />
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

export function ClipA({ clip }: { clip: MAudioClip }) {
  const timelineStart = useLink(clip.timelineStart);
  const timelineLength = useLink(clip.timelineLength);
  const { t: st, u: su } = timelineStart();
  const { t: lt, u: lu } = timelineLength();

  return (
    <fieldset className="bg-gray-800">
      <legend>{clip.constructor.name}</legend>
      <button onClick={() => timelineStart().set(st - 1)}>-</button> {st} {su}{" "}
      <button onClick={() => timelineStart().set(st + 1)}>+</button>
      <br />
      <button onClick={() => timelineStart().set(lt - 1)}>-</button> {lt} {lu}{" "}
      <button onClick={() => timelineLength().set(lt + 1)}>+</button>
    </fieldset>
  );
}
