import { useContainer } from "../../../structured-state/src";
import { AudioClip } from "../structs/AudioClip";

export function ClipA({ clip }: { clip: AudioClip }) {
  const timelineStart = useContainer(clip.timelineStart);
  const timelineLength = useContainer(clip.timelineLength);
  return (
    <fieldset>
      {timelineStart.t} {timelineStart.u} <br />
      {timelineLength.t} {timelineLength.u}
    </fieldset>
  );
}
