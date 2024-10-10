import { useEffect, useState } from "react";
import { useContainer, usePrimitive } from "../../../structured-state/src";
import { recordHistory } from "../../../structured-state/src/sstate.history";
import { AudioTrack } from "../structs/AudioTrack";
import { Project } from "../structs/Project";
import { ClipA } from "./ClipA";

export function TrackA({
  track,
  project,
}: {
  track: AudioTrack;
  project: Project;
}) {
  const [name, setName] = usePrimitive(track.name);
  const [edit, setEdit] = useState(name);
  const clips = useContainer(track.clips);

  useContainer(track);

  useEffect(() => {
    setEdit(name);
  }, [name]);

  function commitEdit() {
    if (edit !== name) {
      recordHistory("set name", () => {
        setName(edit);
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
        ></input>
      </legend>
      {clips.map((clip, i) => {
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
