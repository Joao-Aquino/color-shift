"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ColorEditor } from "@/components/control-bar/color-editor";
import { ControlContainer } from "@/components/control-bar/control-container";
import { CSButton } from "@/components/control-bar/cs-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adjustColorToContrast,
  CONTRAST_THRESHOLDS,
  DEFAULT_CONTRAST_THRESHOLD,
  getContrastScore,
} from "@/lib/color/contrast";
import { createFallbackPair, extractColorPair } from "@/lib/color/palette";
import { fetchPhotos } from "@/lib/photos/client";
import { useResponsiveLayoutMotion } from "@/lib/use-responsive-layout-motion";
import { useTheme } from "@/lib/use-theme";
import type {
  ColorPair,
  ColorTarget,
  ContrastAlgorithm,
  Photo,
} from "@/types/color-shift";

const INITIAL_BUFFER_SIZE = 10;
const REFILL_THRESHOLD = 3;

interface PhotoEntry {
  photo: Photo;
  pair: ColorPair | null;
}

interface ColorSnapshot {
  background: string;
  foreground: string;
}

function LoadingPanel({ className = "" }: { className?: string }) {
  return (
    <Skeleton
      className={`h-full min-w-0 flex-1 rounded-none bg-[var(--color-panel-loading)] ${className}`}
    />
  );
}

export function ColorShiftApp() {
  const layoutRef = useResponsiveLayoutMotion();
  const { theme, setTheme } = useTheme();
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [showCircle, setShowCircle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeColor, setActiveColor] = useState<ColorTarget | null>(null);
  const [history, setHistory] = useState<ColorSnapshot[]>([]);
  const [contrastAlgorithm, setContrastAlgorithm] =
    useState<ContrastAlgorithm>("WCAG");
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [selectedThresholds, setSelectedThresholds] = useState<
    Record<ContrastAlgorithm, number>
  >(() => ({ ...DEFAULT_CONTRAST_THRESHOLD }));
  const entriesRef = useRef(entries);
  const indexRef = useRef(index);
  const activeColorRef = useRef(activeColor);
  const historyRef = useRef(history);
  const gestureStartRef = useRef<ColorSnapshot | null>(null);
  const refillInFlight = useRef(false);
  const requestInFlight = useRef(false);

  const updateEntries = useCallback(
    (updater: (current: PhotoEntry[]) => PhotoEntry[]) => {
      const next = updater(entriesRef.current);
      entriesRef.current = next;
      setEntries(next);
    },
    [],
  );

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    gestureStartRef.current = null;
    setHistory([]);
  }, []);

  const pushHistory = useCallback((snapshot: ColorSnapshot) => {
    const next = [...historyRef.current, snapshot].slice(-100);
    historyRef.current = next;
    setHistory(next);
  }, []);

  const getCurrentSnapshot = useCallback((): ColorSnapshot | null => {
    const pair = entriesRef.current[indexRef.current]?.pair;
    if (!pair) return null;

    return {
      background: pair.background,
      foreground: pair.foreground,
    };
  }, []);

  const updateCurrentPair = useCallback(
    (updater: (pair: ColorPair) => ColorPair) => {
      const currentId = entriesRef.current[indexRef.current]?.photo.id;
      if (!currentId) return;

      updateEntries((current) =>
        current.map((entry) =>
          entry.photo.id === currentId && entry.pair
            ? { ...entry, pair: updater(entry.pair) }
            : entry,
        ),
      );
    },
    [updateEntries],
  );

  const applyEditedColor = useCallback(
    (target: ColorTarget, color: string) => {
      updateCurrentPair((pair) => {
        const next = { ...pair, [target]: color };
        return {
          ...next,
          originalForeground: next.foreground,
          wasBumped: false,
        };
      });
    },
    [updateCurrentPair],
  );

  const commitEditedColor = useCallback(
    (target: ColorTarget, color: string) => {
      const snapshot = getCurrentSnapshot();
      if (!snapshot || snapshot[target] === color) return;

      pushHistory(snapshot);
      applyEditedColor(target, color);
    },
    [applyEditedColor, getCurrentSnapshot, pushHistory],
  );

  const beginColorGesture = useCallback(() => {
    if (gestureStartRef.current) return;
    gestureStartRef.current = getCurrentSnapshot();
  }, [getCurrentSnapshot]);

  const endColorGesture = useCallback(() => {
    const start = gestureStartRef.current;
    const current = getCurrentSnapshot();
    gestureStartRef.current = null;

    if (
      start &&
      current &&
      (start.background !== current.background ||
        start.foreground !== current.foreground)
    ) {
      pushHistory(start);
    }
  }, [getCurrentSnapshot, pushHistory]);

  const undo = useCallback(() => {
    const nextHistory = historyRef.current.slice(0, -1);
    const snapshot = historyRef.current.at(-1);
    if (!snapshot) return;

    historyRef.current = nextHistory;
    gestureStartRef.current = null;
    setHistory(nextHistory);
    updateCurrentPair((pair) => ({
      ...pair,
      ...snapshot,
      originalForeground: snapshot.foreground,
      wasBumped: false,
    }));
  }, [updateCurrentPair]);

  const selectColor = useCallback((target: ColorTarget) => {
    activeColorRef.current = target;
    setActiveColor(target);
  }, []);

  const closeEditor = useCallback((restoreFocus = true) => {
    const target = activeColorRef.current;
    if (!target) return;

    activeColorRef.current = null;
    setActiveColor(null);
    if (!restoreFocus) return;
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-color-field="${target}"]`)
        ?.focus();
    });
  }, []);

  const processPhoto = useCallback(
    async (photo: Photo) => {
      let pair: ColorPair;

      try {
        pair = await extractColorPair(photo.thumbUrl);
      } catch (error) {
        console.warn(`Palette extraction failed for ${photo.id}`, error);
        pair = createFallbackPair(photo.color);
      }

      updateEntries((current) =>
        current.map((entry) =>
          entry.photo.id === photo.id ? { ...entry, pair } : entry,
        ),
      );
    },
    [updateEntries],
  );

  const processPhotos = useCallback(
    (photos: Photo[]) => {
      photos.forEach((photo) => void processPhoto(photo));
    },
    [processPhoto],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialBuffer() {
      try {
        const photos = await fetchPhotos(INITIAL_BUFFER_SIZE, controller.signal);
        if (controller.signal.aborted) return;

        const initialEntries = photos.map((photo) => ({ photo, pair: null }));
        entriesRef.current = initialEntries;
        setEntries(initialEntries);
        setErrorMessage(null);
        processPhotos(photos);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load photos.",
        );
      }
    }

    void loadInitialBuffer();
    return () => controller.abort();
  }, [processPhotos]);

  useEffect(() => {
    const remaining = entries.length - index - 1;
    if (
      entries.length === 0 ||
      remaining > REFILL_THRESHOLD ||
      refillInFlight.current
    ) {
      return;
    }

    refillInFlight.current = true;

    async function refillBuffer() {
      try {
        const photos = await fetchPhotos(INITIAL_BUFFER_SIZE);
        const knownIds = new Set(entriesRef.current.map((entry) => entry.photo.id));
        const newPhotos = photos.filter((photo) => !knownIds.has(photo.id));

        updateEntries((current) => [
          ...current,
          ...newPhotos.map((photo) => ({ photo, pair: null })),
        ]);
        processPhotos(newPhotos);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load more photos.",
        );
      } finally {
        refillInFlight.current = false;
      }
    }

    void refillBuffer();
  }, [entries.length, index, processPhotos, updateEntries]);

  useEffect(() => {
    const nextEntries = entriesRef.current.slice(index + 1, index + 4);

    nextEntries.forEach(({ photo }) => {
      [photo.tinyUrl, photo.thumbUrl, photo.url].forEach((source) => {
        const image = new window.Image();
        image.src = source;
      });
    });
  }, [entries.length, index]);

  const goPrevious = useCallback(() => {
    const next = Math.max(0, indexRef.current - 1);
    if (next === indexRef.current) return;

    indexRef.current = next;
    setIndex(next);
    resetHistory();
  }, [resetHistory]);

  const goNext = useCallback(() => {
    const lastIndex = Math.max(0, entriesRef.current.length - 1);
    const next = Math.min(lastIndex, indexRef.current + 1);
    if (next === indexRef.current) return;

    indexRef.current = next;
    setIndex(next);
    resetHistory();
  }, [resetHistory]);

  const shuffle = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setIsRequesting(true);
    setErrorMessage(null);

    try {
      const [photo] = await fetchPhotos(1);
      if (!photo) throw new Error("No photo was returned.");

      const nextIndex = indexRef.current + 1;
      updateEntries((current) => {
        const next = [...current];
        next.splice(nextIndex, 0, { photo, pair: null });
        return next;
      });
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      resetHistory();
      processPhotos([photo]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load a new photo.",
      );
    } finally {
      requestInFlight.current = false;
      setIsRequesting(false);
    }
  }, [processPhotos, resetHistory, updateEntries]);

  const swapColors = useCallback(() => {
    const snapshot = getCurrentSnapshot();
    if (!snapshot) return;

    pushHistory(snapshot);
    updateCurrentPair((pair) => ({
      ...pair,
      background: pair.foreground,
      foreground: pair.background,
      originalForeground: pair.background,
      wasBumped: false,
    }));

    const target = activeColorRef.current;
    if (target) selectColor(target === "background" ? "foreground" : "background");
  }, [getCurrentSnapshot, pushHistory, selectColor, updateCurrentPair]);

  const adjustActiveColor = useCallback(
    (targetValue: number, mode: "exact" | "minimum") => {
      const pair = entriesRef.current[indexRef.current]?.pair;
      if (!pair) return;

      const colorTarget = activeColorRef.current ?? "foreground";
      const against =
        colorTarget === "foreground" ? pair.background : pair.foreground;
      const adjusted = adjustColorToContrast({
        color: pair[colorTarget],
        against,
        algorithm: contrastAlgorithm,
        target: targetValue,
        colorTarget,
        mode,
      });

      commitEditedColor(colorTarget, adjusted);
    },
    [commitEditedColor, contrastAlgorithm],
  );

  const selectThreshold = useCallback(
    (threshold: number) => {
      setSelectedThresholds((current) => ({
        ...current,
        [contrastAlgorithm]: threshold,
      }));
      adjustActiveColor(threshold, "exact");
    },
    [adjustActiveColor, contrastAlgorithm],
  );

  const fixContrast = useCallback(() => {
    adjustActiveColor(selectedThresholds[contrastAlgorithm], "minimum");
  }, [adjustActiveColor, contrastAlgorithm, selectedThresholds]);

  useEffect(() => {
    if (!activeColor) return;

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(
          "[data-color-editor], [data-color-field], [data-color-field-shell], [data-contrast-score], [data-fix-contrast], [data-photo-actions], .cs-theme-toggle",
        )
      ) {
        return;
      }
      closeEditor(false);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeColor, closeEditor]);

  useEffect(() => {
    if (!scoreExpanded) return;

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-contrast-score], [data-photo-actions], .cs-theme-toggle")) return;
      setScoreExpanded(false);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [scoreExpanded]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA");
      const isInteractive =
        target instanceof HTMLElement &&
        !!target.closest(
          'a[href], button, input, select, textarea, [contenteditable="true"], [role="slider"], [role="tab"]',
        );

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        if (isEditable) return;
        event.preventDefault();
        undo();
        return;
      }

      if (event.key === "Escape") {
        const hasOpenPanel = !!activeColorRef.current || scoreExpanded;
        if (!hasOpenPanel) return;

        event.preventDefault();
        if (activeColorRef.current) closeEditor();
        if (scoreExpanded) setScoreExpanded(false);
        return;
      }

      if (
        isInteractive ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === " ") {
        event.preventDefault();
        void shuffle();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        swapColors();
      } else if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeEditor, goNext, goPrevious, scoreExpanded, shuffle, swapColors, undo, theme, setTheme]);

  const current = entries[index];
  const pair = current?.pair ?? null;
  const score = pair
    ? getContrastScore(pair.foreground, pair.background, contrastAlgorithm)
    : null;
  const thresholds = CONTRAST_THRESHOLDS[contrastAlgorithm];
  const selectedThreshold = selectedThresholds[contrastAlgorithm];
  const nearestThreshold = score
    ? thresholds.reduce((nearest, threshold) =>
        Math.abs(threshold - score.value) < Math.abs(nearest - score.value)
          ? threshold
          : nearest,
      )
    : selectedThreshold;
  const ready = !!current && !!pair;

  const preview = (
    <div data-responsive-motion="preview" className="cs-preview">
      <div className="cs-preview-panels">
        {ready ? (
          <button
            aria-label={showCircle ? "Show Aa specimen" : "Show circle specimen"}
            data-responsive-motion="specimen"
            className="group flex h-full min-w-0 flex-1 cursor-pointer items-center justify-center overflow-hidden transition-colors duration-300 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current"
            onClick={() => setShowCircle((currentValue) => !currentValue)}
            style={{ backgroundColor: pair.background, color: pair.foreground }}
            type="button"
          >
            {showCircle ? (
              <span
                aria-hidden
                data-responsive-motion="circle"
                className="inline-flex aspect-square w-[min(240px,52%)]"
              >
                <span data-responsive-circle-shape className="inline-flex h-full w-full">
                  <span className="h-full w-full rounded-full bg-current transition-[transform,opacity] duration-200 group-active:scale-95" />
                </span>
              </span>
            ) : (
              <span data-responsive-motion="type" className="cs-specimen-type inline-flex">
                <span className="transition-[transform,opacity] duration-200 group-active:scale-95">
                  Aa
                </span>
              </span>
            )}
          </button>
        ) : (
          <LoadingPanel />
        )}

        <section
          aria-label="Source photo"
          data-responsive-motion="photo"
          className="relative h-full min-w-0 flex-1 overflow-hidden bg-[var(--color-panel-loading)]"
        >
          {ready ? (
            <>
              <Image
                key={current.photo.id}
                alt={current.photo.alt}
                blurDataURL={current.photo.tinyUrl}
                className="object-cover"
                fill
                placeholder="blur"
                preload={index === 0}
                quality={90}
                sizes="(min-width: 1180px) 38vw, 50vw"
                src={current.photo.url}
              />
            </>
          ) : (
            <LoadingPanel />
          )}

          {errorMessage ? (
            <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-4 rounded-[6px] border border-white/10 bg-black/90 p-3 text-sm text-white shadow-lg">
              <p>{errorMessage}</p>
              <CSButton
                className="h-8 shrink-0 border-white/20 px-3 text-xs text-white hover:bg-white/10"
                onClick={() => void shuffle()}
              >
                Retry
              </CSButton>
            </div>
          ) : null}
        </section>
      </div>
      {ready && (
        <p className="cs-credit">
          <span className="cs-credit-label uppercase">Photo</span>
          <a
            className="underline-offset-2 hover:underline focus-visible:outline-2"
            href={current.photo.photographerUrl}
            rel="noreferrer"
            target="_blank"
          >
            {current.photo.photographer}
          </a>
          <span className="cs-credit-label">on</span>
          <a
            className="underline-offset-2 hover:underline focus-visible:outline-2"
            href={current.photo.photoUrl}
            rel="noreferrer"
            target="_blank"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  );

  return (
    <main ref={layoutRef} className="cs-app">
      <ControlContainer
        preview={preview}
        theme={theme}
        onThemeChange={setTheme}
        activeTarget={activeColor}
        algorithm={contrastAlgorithm}
        background={pair?.background ?? null}
        canFix={!!score && score.value < selectedThreshold}
        canGoNext={index < entries.length - 1}
        canGoPrevious={index > 0}
        canUndo={history.length > 0}
        disabled={!ready || isRequesting}
        editor={
          activeColor && pair ? (
            <ColorEditor
              color={pair[activeColor]}
              onChange={(color) => applyEditedColor(activeColor, color)}
              onCommit={(color) => commitEditedColor(activeColor, color)}
              onGestureEnd={endColorGesture}
              onGestureStart={beginColorGesture}
              target={activeColor}
            />
          ) : null
        }
        foreground={pair?.foreground ?? null}
        nearestThreshold={nearestThreshold}
        onAlgorithmChange={setContrastAlgorithm}
        onFix={fixContrast}
        onNext={goNext}
        onPrevious={goPrevious}
        onSelectColor={selectColor}
        onScoreExpandedChange={setScoreExpanded}
        onShuffle={() => void shuffle()}
        onSwap={swapColors}
        onThresholdSelect={selectThreshold}
        onUndo={undo}
        photo={current?.photo ?? null}
        score={score}
        scoreExpanded={scoreExpanded}
        selectedThreshold={selectedThreshold}
        thresholds={thresholds}
      />
    </main>
  );
}
