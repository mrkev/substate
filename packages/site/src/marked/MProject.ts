import {
  MarkedSerializable,
  SerializationMark,
} from "@mrkev/marked-serializable";
import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mMap,
  mSet,
  mValue,
  SubbableMark,
} from "@mrkev/marked-subbable";
import { MAudioTrack } from "./MAudioTrack";

type Marker = readonly [number, string];

export class MProject
  implements MarkedSubbable, MarkedSerializable<typeof serialization_mproject>
{
  readonly $$mark = SubbableMark.create();
  readonly $$serialization = serialization_mproject;

  readonly randomNumbers: MarkedSet<number>;

  constructor(
    public readonly name: MarkedValue<string>,
    readonly tracks: MarkedArray<MAudioTrack>,
    readonly markers: MarkedMap<number, string>,
    readonly solodTracks: MarkedSet<MAudioTrack>
  ) {
    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
    this.randomNumbers = mSet();

    this.$$mark.register(this, [
      name,
      tracks,
      markers,
      solodTracks,
      this.randomNumbers,
    ]);
  }

  static of(name: string, tracks: MAudioTrack[], markers: Marker[]) {
    return new MProject(mValue(name), mArray(tracks), mMap(markers), mSet());
  }

  addTrack(name: string) {
    const track = MAudioTrack.of(name, []);
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop());
  }
}

type SMProject = {
  readonly name: MarkedValue<string>;
  readonly tracks: MarkedArray<MAudioTrack>;
  readonly markers: MarkedMap<number, string>;
  readonly solodTracks: MarkedSet<MAudioTrack>;
};

export const serialization_mproject: SerializationMark<SMProject, MProject> =
  SerializationMark.create({
    kind: "mproject",
    construct({ name, tracks, markers, solodTracks }) {
      return new MProject(name, tracks, markers, solodTracks);
    },
    simplify(mproject: MProject) {
      return {
        name: mproject.name,
        tracks: mproject.tracks,
        markers: mproject.markers,
        solodTracks: mproject.solodTracks,
      };
    },
  });
