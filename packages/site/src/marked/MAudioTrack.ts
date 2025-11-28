import {
  MarkedArray,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mValue,
  SubbableMark,
} from "../../../subbable-state/index";
import { MAudioClip } from "./MAudioClip";
import {
  MarkedSerializable,
  SerializationMark,
} from "./serialization/MarkedSerializable";

export class MAudioTrack
  implements
    MarkedSubbable,
    MarkedSerializable<typeof serialization_maudiotrack>
{
  readonly $$mark = SubbableMark.create();
  readonly $$serialization = serialization_maudiotrack;

  constructor(
    public readonly name: MarkedValue<string>,
    public readonly clips: MarkedArray<MAudioClip>
  ) {
    this.$$mark.register(this, [name]);
  }

  static of(name: string, clips: MAudioClip[]) {
    return new MAudioTrack(mValue(name), mArray(clips));
  }
}

/////////// Serialization

type Descriptor = {
  name: MarkedValue<string>;
  clips: MarkedArray<MAudioClip>;
};

export const serialization_maudiotrack: SerializationMark<
  Descriptor,
  MAudioTrack
> = SerializationMark.create({
  kind: "maudiotrack",
  construct({ name, clips }) {
    return new MAudioTrack(name, clips);
  },
  simplify(track) {
    return {
      name: track.name,
      clips: track.clips,
    };
  },
});
