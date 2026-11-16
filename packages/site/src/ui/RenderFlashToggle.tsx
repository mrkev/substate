import { twMerge } from "tailwind-merge";
import { setRenderFlashEnabled, useRenderFlashEnabled } from "./renderFlash";

export function RenderFlashToggle({ className }: { className?: string }) {
  const enabled = useRenderFlashEnabled();
  return (
    <label
      className={twMerge(
        "flex cursor-pointer items-center gap-1.5 text-muted select-none",
        className,
      )}
      title="Outline components when they re-render. The badge counts commits."
    >
      <input
        type="checkbox"
        className="accent-flash"
        checked={enabled}
        onChange={(e) => setRenderFlashEnabled(e.target.checked)}
      />
      highlight renders
    </label>
  );
}
