import {
  array,
  arrayOf,
  InitFunctions,
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
  readonly randomNumbers: SSet<number>;

  constructor(
    readonly name: SString,
    readonly tracks: SSchemaArray<AudioTrack>,
    readonly markers: SArray<Marker>
  ) {
    super();

    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
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

  // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
  override replace(json: JSONOfAuto<AutoProject>): void {
    replace.string(json.name, this.name);
    replace.schemaArray(json.tracks, this.tracks);
    replace.set(json.randomNumbers, this.randomNumbers);
    replace.array(json.markers, this.markers);
  }

  static construct(auto: JSONOfAuto<AutoProject>, init: InitFunctions) {
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
