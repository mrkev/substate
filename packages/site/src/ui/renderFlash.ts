import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Render highlighting. Components call useRenderFlash() and attach the ref to
 * their root element. Every commit bumps a counter on that element
 * (data-renders) and, when highlighting is on, flashes its outline. The badge
 * and outline are pure CSS (see index.css), so toggling highlighting never
 * re-renders the components being observed.
 */

const STORAGE_KEY = "site:render-flash";
const FLASH_COLOR = "#facc15";

const listeners = new Set<() => void>();
let enabled = readStored();
applyToDocument();

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function applyToDocument() {
  if (enabled) {
    document.documentElement.dataset.renderFlash = "";
  } else {
    delete document.documentElement.dataset.renderFlash;
  }
}

export function setRenderFlashEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore, it's just a preference
  }
  applyToDocument();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRenderFlash<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const count = useRef(0);

  // StrictMode runs mount effects twice. This runs before the effect below, so
  // resetting here keeps the first commit counted as 1.
  useEffect(() => {
    count.current = 0;
  }, []);

  useEffect(() => {
    count.current++;
    const elem = ref.current;
    if (elem == null) {
      return;
    }
    elem.dataset.renders = String(count.current);
    if (enabled) {
      elem.animate(
        [{ outlineColor: FLASH_COLOR }, { outlineColor: "transparent" }],
        { duration: 600, easing: "ease-out" },
      );
    }
  });

  return ref;
}

export function useRenderFlashEnabled() {
  return useSyncExternalStore(subscribe, () => enabled);
}
