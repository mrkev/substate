import {
  MarkedArray,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mValue,
  SubbableMark,
} from "../../../subbable-state/index";
import { MAudioClip } from "./MAudioClip";

export class MAudioTrack implements MarkedSubbable {
  // , MarkedSerializable<Descriptor, MAudioTrack>
  readonly $$mark = SubbableMark.create();
  // readonly $$serialization = serialization;

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

// const serialization: SerializationMark<Descriptor, MAudioTrack> =
//   SerializationMark.create({
//     construct(track) {
//       return {
//         name: track.name,
//         clips: track.clips,
//       };
//     },
//     simplify() {},
//   });
