import { useState } from "react";
import { nullthrows, setWindow } from "../../../linked-state/src/nullthrows";
import { useLink } from "../../../subbable-state";
import { MAudioClip, MAudioTrack, MProject } from "./MarkedProject";

const project = MProject.of(
  "untitled track",
  [
    MAudioTrack.of("track 1", [MAudioClip.of(0, 4)]),
    MAudioTrack.of("track 2", []),
  ]
  // [
  //   [0, "foo"],
  //   [1, "bar"],
  // ]
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
        {/* <ProjectDebug project={project} /> */}

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
  // const markers = useLink(project.markers);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div>
        Set: {randomNumbers().size}
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
      {/* <div>
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
      </div> */}
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
      <hr style={{ width: "100%" }} />

      {tracks().map((track) => {
        return (
          <TrackA project={project} key={track.$$mark._id} track={track} />
        );
      })}
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

// function ProjectDebug({ project }: { project: Project }) {
//   const [tab, setTab] = useState<"struct" | "serialized">("struct");
//   return (
//     <div style={{ flex: "1 1 1px" }}>
//       <UtilityToggle
//         toggled={tab === "struct"}
//         onToggle={() => setTab("struct")}
//       >
//         struct
//       </UtilityToggle>
//       <UtilityToggle
//         toggled={tab === "serialized"}
//         onToggle={() => setTab("serialized")}
//       >
//         serialized
//       </UtilityToggle>
//       {tab === "struct" && <s.DebugOut val={project}></s.DebugOut>}
//       {tab === "serialized" && (
//         <div
//           style={{
//             overflow: "scroll",
//             textAlign: "left",
//             fontFamily: "monospace",
//           }}
//         >
//           <JSONView json={JSON.parse(serialize(project))} />
//         </div>
//       )}
//     </div>
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
    <fieldset>
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
      {/* <UtilityToggle
        onToggle={() => {
          if (project.solodTracks.has(track)) {
            project.solodTracks.delete(track);
          } else {
            project.solodTracks.add(track);
          }
        }}
        toggled={project.solodTracks.has(track)}
      >
        s
      </UtilityToggle> */}
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
    </fieldset>
  );
}

export function ClipA({ clip }: { clip: MAudioClip }) {
  const timelineStart = useLink(clip.timelineStart);
  const timelineLength = useLink(clip.timelineLength);
  const { t: st, u: su } = timelineStart();
  const { t: lt, u: lu } = timelineLength();

  return (
    <fieldset>
      <legend>{clip.constructor.name}</legend>
      <button onClick={() => timelineStart().set(st - 1)}>-</button> {st} {su}{" "}
      <button onClick={() => timelineStart().set(st + 1)}>+</button>
      <br />
      <button onClick={() => timelineStart().set(lt - 1)}>-</button> {lt} {lu}{" "}
      <button onClick={() => timelineLength().set(lt + 1)}>+</button>
    </fieldset>
  );
}
