import { MarkedMap } from "../../../subbable-state/dist";
import {
  MarkedArray,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mMap,
  mSet,
  mValue,
  SubbableMark,
} from "../../../subbable-state/index";

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

export class MAudioTrack implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

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

export class MAudioClip implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  constructor(
    //
    readonly timelineStart: MTime,
    readonly timelineLength: MTime
  ) {
    this.$$mark.register(this, [timelineStart, timelineLength]);
  }

  static of(timelineStart: number, timelineLength: number) {
    return new MAudioClip(
      time(timelineStart, "seconds"),
      time(timelineLength, "seconds")
    );
  }
}

type TimeUnit = "pulses" | "seconds" | "bars";

export class MTime implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    this.$$mark.register(this);
  }

  public set(t: number, u?: TimeUnit) {
    this.$$mark.mutate(this, () => {
      this.t = Math.max(t, 0);
      if (u != null) {
        this.u = u;
      }
    });
  }
}

export function time(t: number, u: "pulses" | "seconds") {
  return new MTime(t, u);
}
