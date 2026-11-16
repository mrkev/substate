import { useState } from "react";
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
import { useRenderFlash } from "./renderFlash";

export function TrackA({
  track,
  project,
}: {
  track: AudioTrack;
  project: Project;
}) {
  const [name, setName] = usePrimitive(track.name);
  // what the user is typing, or null when not editing, so the input shows the
  // current name without syncing it into local state in an effect
  const [draft, setDraft] = useState<string | null>(null);
  const clips = useContainer(track.clips);
  const ref = useRenderFlash<HTMLFieldSetElement>();

  useContainer(track);

  function commitEdit() {
    if (draft !== null && draft !== name) {
      recordHistory("set name", () => {
        setName(draft);
      });
    }
    setDraft(null);
  }

  return (
    <fieldset ref={ref} className="flex flex-col gap-2 p-2">
      <legend>
        {track.constructor.name}{" "}
        <input
          className="w-[10ch]"
          type="text"
          value={draft ?? name ?? ""}
          placeholder="name"
          onChange={(e) => setDraft(e.target.value)}
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
