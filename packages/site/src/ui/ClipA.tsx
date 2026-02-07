import { useContainer } from "../../../structured-state/src";
import { AudioClip } from "../structs/AudioClip";

export function ClipA({
  clip,
  onRemove,
}: {
  clip: AudioClip;
  onRemove: () => void;
}) {
  const timelineStart = useContainer(clip.timelineStart);
  const timelineLength = useContainer(clip.timelineLength);
  const { t: st, u: su } = timelineStart;
  const { t: lt, u: lu } = timelineLength;
  return (
    <fieldset className="bg-gray-800">
      <legend className="flex flex-row text-left w-full justify-between">
        {clip.constructor.name}
        <button onClick={onRemove}>x</button>
      </legend>
      <button onClick={() => timelineStart.set(st - 1)}>-</button> {st} {su}{" "}
      <button onClick={() => timelineStart.set(st + 1)}>+</button>
      <br />
      <button onClick={() => timelineLength.set(lt - 1)}>-</button> {lt} {lu}{" "}
      <button onClick={() => timelineLength.set(lt + 1)}>+</button>
    </fieldset>
  );
}
