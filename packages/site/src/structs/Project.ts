import {
  array,
  arrayOf,
  init,
  JSONOfAuto,
  replace,
  SArray,
  set,
  SSchemaArray,
  SSet,
  SString,
  string,
  Structured,
} from "../../../structured-state/src";
import { AudioTrack } from "./AudioTrack";

type AutoProject = {
  name: SString;
  tracks: SSchemaArray<AudioTrack>;
  randomNumbers: SSet<number>;
  markers: SArray<Marker>;
};

export type Marker = readonly [number, string];

export class Project extends Structured<AutoProject, typeof Project> {
  // readonly tracks: SSchemaArray<MidiTrack>;
  // readonly effects: SArray<Effect>;

  readonly randomNumbers: SSet<number>;

  constructor(
    readonly name: SString,
    readonly tracks: SSchemaArray<AudioTrack>,
    readonly markers: SArray<Marker>
  ) {
    super();

    // this.tracks = arrayOf([MidiTrack], clips);
    // this.effects = array<Effect>();
    // [["foo", 3]] // why does this print as unknown when empty?
    // TODO: it's bc it's unintialized
    this.randomNumbers = set();
  }

  override autoSimplify() {
    return {
      name: this.name,
      tracks: this.tracks,
      randomNumbers: this.randomNumbers,
      markers: this.markers,
    };
  }

  override replace(json: JSONOfAuto<AutoProject>): void {
    replace.string(json.name, this.name);
    // TODO: replace other knowables
    // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
    // this.clips._setRaw(json.clips)
  }

  static construct(auto: JSONOfAuto<AutoProject>) {
    // TODO: asnync constructors
    return Structured.create(
      Project,
      init.string(auto.name),
      init.schemaArray(auto.tracks, [AudioTrack]),
      init.array<Marker>(auto.markers)
    );
  }

  static of(name: string, tracks: AudioTrack[], markers: Marker[]) {
    return Structured.create(
      Project,
      string(name),
      arrayOf([AudioTrack], tracks),
      array(markers)
    );
  }

  addTrack(name: string) {
    const track = AudioTrack.of(name, []);
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop()) {}
  }
}
