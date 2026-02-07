import { useEffect, useState } from "react";
import {
  Structured,
  useContainer,
  usePrimitive,
} from "../../../structured-state/src";
import { recordHistory } from "../../../structured-state/src/sstate.history";
import { UtilityToggle } from "../UtilityToggle";
import { AudioClip } from "../structs/AudioClip";
import { AudioTrack } from "../structs/AudioTrack";
import { Project } from "../structs/Project";
import { time } from "../structs/TimelineT";
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
            recordHistory("remove clip", () => {
              project.tracks.remove(track);
            })
          }
        />
      </legend>
      <UtilityToggle
        className="self-start border px-1"
        style={{ background: "none", border: "1px solid gray" }}
        onToggle={() => {
          if (project.solodTracks.has(track)) {
            project.solodTracks.delete(track);
          } else {
            project.solodTracks.add(track);
          }
        }}
        toggled={project.solodTracks.has(track)}
      >
        {" solo "}
      </UtilityToggle>
      {clips.map((clip, i) => {
        return (
          <ClipA
            key={i}
            clip={clip}
            onRemove={() =>
              recordHistory("remove clip", () => {
                track.clips.remove(clip);
              })
            }
          />
        );
      })}
      <button
        style={{ background: "#333" }}
        onClick={() =>
          clips.push(
            Structured.create(
              AudioClip,
              time(4, "seconds"),
              time(4, "seconds"),
            ),
          )
        }
      >
        +
      </button>
    </fieldset>
  );
}
