import {
  MarkedSerializable,
  SerializationMark,
} from "@mrkev/marked-serializable";
import {
  MarkedArray,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mValue,
  SubbableMark,
} from "@mrkev/marked-subbable";
import { MAudioClip } from "./MAudioClip";

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
    this.$$mark.register(this, [name, clips]);
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
