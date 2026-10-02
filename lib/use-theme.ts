"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, readTheme, setTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  function onStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === null) applyTheme(readTheme());
  }
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme { return "dark"; }

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useLayoutEffect(() => {
    applyTheme(readTheme());
    const frame = requestAnimationFrame(() => { document.documentElement.dataset.themeReady = "true"; });
    return () => cancelAnimationFrame(frame);
  }, []);
  return { theme, setTheme };
}
