import {
  MarkedArray,
  MarkedSet,
  MarkedValue,
  mArray,
  mSet,
  mValue,
} from "../../../subbable-state";
import {
  MarkedSubbable,
  SubbableMark,
} from "../../../subbable-state/lib/SubbableMark";

export class MProject implements MarkedSubbable {
  readonly $$mark: SubbableMark;
  readonly randomNumbers: MarkedSet<number>;

  constructor(
    public readonly name: MarkedValue<string>, // readonly markers: SArray<Marker>, // readonly solodTracks: MarkedSet<AudioTrack>
    readonly tracks: MarkedArray<MAudioTrack>
  ) {
    this.$$mark = SubbableMark.create(this, [name, tracks]);

    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
    this.randomNumbers = mSet();
  }

  static of(name: string, tracks: MAudioTrack[]) {
    return new MProject(mValue(name), mArray(tracks));
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
  readonly $$mark: SubbableMark;
  constructor(
    public readonly name: MarkedValue<string>,
    public readonly clips: MarkedArray<MAudioClip>
  ) {
    this.$$mark = SubbableMark.create(this, [name]);
  }

  static of(name: string, clips: MAudioClip[]) {
    return new MAudioTrack(mValue(name), mArray(clips));
  }
}

export class MAudioClip implements MarkedSubbable {
  readonly $$mark: SubbableMark;
  constructor(
    //
    readonly timelineStart: MTime,
    readonly timelineLength: MTime
  ) {
    this.$$mark = SubbableMark.create(this);
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
  readonly $$mark: SubbableMark;

  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    this.$$mark = SubbableMark.create(this);
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
