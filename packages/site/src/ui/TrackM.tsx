import * as React from "react";
import { useEffect, useState } from "react";
import { useContainer, usePrimitive } from "../../../structured-state/src";
import { recordHistory } from "../../../structured-state/src/sstate.history";
import { Notes } from "../App";
import { MidiTrack } from "../structs/MidiTrack";
import { Project } from "../structs/Project";

export const TrackM = React.memo(function TrackMImpl({
  track,
  project,
}: {
  track: MidiTrack;
  project: Project;
}) {
  const [name, setName] = usePrimitive(track.name);
  const [edit, setEdit] = useState(name);

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
          disabled
          // onClick={() =>
          //   recordHistory("remove clip", () => {
          //     project.tracks.remove(track);
          //   })
          // }
        ></input>
      </legend>

      {track.counter}

      <input
        type="button"
        value={"+"}
        onClick={() =>
          recordHistory("increase counter", () => {
            track.featuredMutation(() => {
              track.counter += 1;
            });
          })
        }
      ></input>
      <Notes notes={track.tupleArr} />
    </fieldset>
  );
});
