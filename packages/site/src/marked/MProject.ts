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
} from "../../../subbable-state/index";
import { MAudioTrack } from "./MAudioTrack";

type Marker = readonly [number, string];

export class MProject implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  readonly randomNumbers: MarkedSet<number>;

  constructor(
    public readonly name: MarkedValue<string>,
    readonly tracks: MarkedArray<MAudioTrack>,
    readonly markers: MarkedMap<number, string>,
    readonly solodTracks: MarkedSet<MAudioTrack>
  ) {
    this.$$mark.register(this, [name, tracks, markers, solodTracks]);

    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
    this.randomNumbers = mSet();
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
