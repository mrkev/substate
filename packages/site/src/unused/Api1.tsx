import { useContainer } from "../../../structured-state/src/index";
import { setWindow } from "../../../structured-state/src/lib/nullthrows";
import * as nw from "../../../structured-state/src/_nw/nwschema";
import {
  Concretized,
  SubNumber,
  useSubToObjectCached,
  useSubbable,
} from "../../../structured-state/src/_nw/subschema";

export type Track = Concretized<typeof Track>;
export const Track = nw.object({
  name: nw.string(),
});

export type ProjectState = Concretized<typeof ProjectState>;
export const ProjectState = nw.object({
  lions: nw.number(),
  tigers: nw.number(),
  tracks: nw.array(Track),
});

const project = ProjectState.create({
  lions: 0,
  tigers: 0,
  tracks: [],
});

setWindow("project", project);

export function Api1() {
  return (
    <>
      <CountEditor num={project.at("lions")} />
      <CountEditor num={project.at("tigers")} />
      <button
        onClick={() => {
          const newTrack = Track.create({ name: "hello world" });
          project.at("tracks").push(newTrack);
        }}
      >
        Add track
      </button>
      <Tracklist />
      <ProjectDebug />
    </>
  );
}

function CountEditor({ num }: { num: SubNumber }) {
  const [count, setCount] = useSubbable(num);
  return (
    <button
      onClick={() => {
        setCount((prev) => prev + 1);
      }}
    >
      count is {count}
    </button>
  );
}

function Tracklist() {
  const tracks = useContainer(project.at("tracks"));
  return (
    <div>
      {tracks.map((track, i) => {
        return (
          <TrackA
            key={i}
            track={track}
            onTrackDelete={() => tracks.remove(track)}
          />
        );
      })}
    </div>
  );
}

function TrackA({
  track,
  onTrackDelete,
}: {
  track: Track;
  onTrackDelete: () => void;
}) {
  const [name, setName] = useSubbable(track.at("name"));

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      ></input>
      <button onClick={onTrackDelete}>x</button>
    </div>
  );
}

function ProjectDebug() {
  const projectObj = useSubToObjectCached(project);
  return (
    <pre style={{ textAlign: "left" }}>
      {JSON.stringify(projectObj, null, 2)}
    </pre>
  );
}
