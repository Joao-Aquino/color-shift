"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";

import { ColorEditor } from "@/components/control-bar/color-editor";
import { ControlContainer } from "@/components/control-bar/control-container";
import { ControlsBar } from "@/components/control-bar/controls-bar";
import { CSButton } from "@/components/control-bar/cs-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Specimen } from "@/components/specimen";
import { useThemeWipeToggle } from "@/components/ui/theme-wipe-toggle";
import { PhotoTransition } from "@/components/photo-transition";
import {
  adjustColorToContrast,
  CONTRAST_THRESHOLDS,
  DEFAULT_CONTRAST_THRESHOLD,
  getContrastScore,
} from "@/lib/color/contrast";
import { createFallbackPair, extractColorPair } from "@/lib/color/palette";
import { adaptColorPairToTheme } from "@/lib/color/theme-pair";
import { fetchPhotos } from "@/lib/photos/client";
import { selectPhotoForTheme } from "@/lib/photos/theme-selection";
import { useResponsiveLayoutMotion } from "@/lib/use-responsive-layout-motion";
import { useFlipLayoutMotion } from "@/lib/use-flip-layout-motion";
import { useTheme } from "@/lib/use-theme";
import type { Theme } from "@/lib/theme";
import type {
  ColorPair,
  ColorTarget,
  ContrastAlgorithm,
  Photo,
} from "@/types/color-shift";

const INITIAL_BUFFER_SIZE = 10;
const REFILL_THRESHOLD = 3;
const THEMED_PHOTO_CANDIDATES = 4;
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

interface PhotoEntry {
  photo: Photo;
  pair: ColorPair | null;
}

interface ColorSnapshot {
  background: string;
  foreground: string;
}

function activeTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
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
  const { theme } = useTheme();
  const { changeTheme } = useThemeWipeToggle();
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [specimenText, setSpecimenText] = useState("Aa");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
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
  const importInFlight = useRef(false);
  const dragDepth = useRef(0);
  const localPhotoUrls = useRef<string[]>([]);
  const settleSidebarLayout = useFlipLayoutMotion(layoutRef,
    `${activeColor ?? "closed"}:${scoreExpanded}`,
    Number(activeColor !== null) + Number(scoreExpanded), "[data-sidebar-layout]", true);
  const changeScoreExpanded = useCallback((expanded: boolean) => {
    settleSidebarLayout();
    setScoreExpanded(expanded);
  }, [settleSidebarLayout]);

  useEffect(() => {
    const urls = localPhotoUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

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
    if (target === activeColorRef.current) return;
    settleSidebarLayout();
    activeColorRef.current = target;
    setActiveColor(target);
  }, [settleSidebarLayout]);

  const closeEditor = useCallback((restoreFocus = true) => {
    const target = activeColorRef.current;
    if (!target) return;

    settleSidebarLayout();
    activeColorRef.current = null;
    setActiveColor(null);
    if (!restoreFocus) return;
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-color-field="${target}"]`)
        ?.focus();
    });
  }, [settleSidebarLayout]);

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
          entry.photo.id === photo.id && !entry.pair ? { ...entry, pair } : entry,
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

  const importPhoto = useCallback(async (file: File) => {
    if (importInFlight.current) return;
    setImportError(null);
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setImportError("Use a JPEG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError("Choose an image smaller than 20 MB.");
      return;
    }

    importInFlight.current = true;
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      const pair = await extractColorPair(url);
      const photo: Photo = {
        id: `local-${crypto.randomUUID()}`,
        source: "local",
        fileName: file.name,
        url,
        thumbUrl: url,
        tinyUrl: url,
        color: pair.background,
        width: image.naturalWidth,
        height: image.naturalHeight,
        alt: `Your photo: ${file.name}`,
        photographer: "You",
        photographerUrl: "",
        photoUrl: "",
      };
      const nextIndex = Math.min(indexRef.current + 1, entriesRef.current.length);
      updateEntries((current) => {
        const next = [...current];
        next.splice(nextIndex, 0, { photo, pair });
        return next;
      });
      localPhotoUrls.current.push(url);
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      resetHistory();
      setErrorMessage(null);
    } catch {
      URL.revokeObjectURL(url);
      setImportError("This image could not be opened or its colors could not be extracted.");
    } finally {
      importInFlight.current = false;
    }
  }, [resetHistory, updateEntries]);

  const onPhotoDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepth.current += 1;
    setIsDraggingPhoto(true);
  }, []);

  const onPhotoDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingPhoto(false);
  }, []);

  const onPhotoDrop = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDraggingPhoto(false);
    const file = event.dataTransfer.files[0];
    if (file) void importPhoto(file);
  }, [importPhoto]);

  const onPhotoDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialBuffer() {
      try {
        const photos = await fetchPhotos(INITIAL_BUFFER_SIZE, controller.signal);
        if (controller.signal.aborted) return;

        const initialEntries = photos.map((photo) => ({ photo, pair: null }));
        if (entriesRef.current.length > 0) {
          updateEntries((current) => [...current, ...initialEntries]);
          processPhotos(photos);
          return;
        }
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
  }, [processPhotos, updateEntries]);

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
      const photos = await fetchPhotos(THEMED_PHOTO_CANDIDATES, undefined, activeTheme());
      const photo = await selectPhotoForTheme(photos, activeTheme);
      let pair: ColorPair;
      try {
        pair = await extractColorPair(photo.thumbUrl);
      } catch {
        pair = createFallbackPair(photo.color);
      }
      pair = adaptColorPairToTheme(pair, activeTheme());

      const nextIndex = Math.min(indexRef.current + 1, entriesRef.current.length);
      updateEntries((current) => {
        const next = [...current];
        next.splice(nextIndex, 0, { photo, pair });
        return next;
      });
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      resetHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load a new photo.",
      );
    } finally {
      requestInFlight.current = false;
      setIsRequesting(false);
    }
  }, [resetHistory, updateEntries]);

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
      changeScoreExpanded(false);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [scoreExpanded, changeScoreExpanded]);

  useEffect(() => {
    function handleActionEscape(event: KeyboardEvent) {
      if (
        event.key !== "Escape" ||
        !(event.target instanceof Element) ||
        !event.target.closest(".cs-panel-actions") ||
        (!activeColorRef.current && !scoreExpanded)
      ) return;

      event.preventDefault();
      if (activeColorRef.current) closeEditor();
      if (scoreExpanded) changeScoreExpanded(false);
    }

    window.addEventListener("keydown", handleActionEscape, true);
    return () => window.removeEventListener("keydown", handleActionEscape, true);
  }, [closeEditor, scoreExpanded, changeScoreExpanded]);

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
        if (scoreExpanded) changeScoreExpanded(false);
        return;
      }

      if (
        isEditable ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        if (!event.repeat) changeTheme(theme === "dark" ? "light" : "dark");
        return;
      }
      if (isInteractive) return;

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
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (event.repeat || isRequesting) return;
        const pair = entriesRef.current[indexRef.current]?.pair;
        if (pair && getContrastScore(pair.foreground, pair.background, contrastAlgorithm).value < selectedThresholds[contrastAlgorithm]) {
          fixContrast();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeEditor, goNext, goPrevious, scoreExpanded, shuffle, swapColors, undo, theme, changeTheme, changeScoreExpanded, isRequesting, contrastAlgorithm, selectedThresholds, fixContrast]);

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
  const actions = {
    canFix: !!score && score.value < selectedThreshold,
    canGoNext: index < entries.length - 1,
    canGoPrevious: index > 0,
    canUndo: history.length > 0,
    disabled: !ready || isRequesting,
    onFix: fixContrast,
    onNext: goNext,
    onPrevious: goPrevious,
    onShuffle: () => void shuffle(),
    onSwap: swapColors,
    onUndo: undo,
  };

  const preview = (
    <div data-responsive-motion="preview" data-dragging={isDraggingPhoto} className="cs-preview">
      <div className="cs-preview-panels">
        <div className="cs-specimen-panel relative min-w-0">
          {ready ? (
            <Specimen
              background={pair.background}
              foreground={pair.foreground}
              text={specimenText}
              onTextChange={setSpecimenText}
            />
          ) : (
            <LoadingPanel />
          )}
          <ControlsBar {...actions} group="specimen" />
        </div>

        <section
          aria-label="Source photo"
          data-responsive-motion="photo"
          className="relative h-full min-w-0 flex-1 overflow-hidden bg-[var(--color-panel-loading)]"
          onDragEnter={onPhotoDragEnter}
          onDragLeave={onPhotoDragLeave}
          onDragOver={onPhotoDragOver}
          onDrop={onPhotoDrop}
        >
          {current ? (
            <PhotoTransition photo={current.photo} />
          ) : (
            <LoadingPanel />
          )}

          <div className="cs-photo-drop" aria-hidden={!isDraggingPhoto} data-active={isDraggingPhoto}>
            <span className="cs-photo-drop-icon" />
            <div className="cs-photo-drop-copy">
              <p className="cs-photo-drop-title">Drag your image to extract the colors</p>
              <p className="cs-photo-drop-formats">
                <strong>JPEG, PNG, WebP, AVIF</strong> and <strong>GIF</strong> up to <strong>20 MB</strong>
              </p>
            </div>
          </div>

          {importError ? (
            <div role="alert" className="cs-import-error">
              <span>{importError}</span>
              <button aria-label="Dismiss image error" onClick={() => setImportError(null)} type="button">×</button>
            </div>
          ) : null}

          {errorMessage && current?.photo.source !== "local" ? (
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
          <ControlsBar {...actions} group="photo" />
        </section>
      </div>
      {ready && (current.photo.source === "local" ? (
        <p className="cs-credit">Your photo · {current.photo.fileName}</p>
      ) : (
        <p className="cs-credit">
          <span className="cs-credit-label uppercase">Photo</span>
          <span className="cs-credit-label">by</span>
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
      ))}
    </div>
  );

  return (
    <main ref={layoutRef} className="cs-app">
      <ControlContainer
        preview={preview}
        theme={theme}
        onThemeChange={changeTheme}
        activeTarget={activeColor}
        algorithm={contrastAlgorithm}
        background={pair?.background ?? null}
        disabled={actions.disabled}
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
        onSelectColor={selectColor}
        onScoreExpandedChange={changeScoreExpanded}
        onThresholdSelect={selectThreshold}
        photo={current?.photo ?? null}
        score={score}
        scoreExpanded={scoreExpanded}
        selectedThreshold={selectedThreshold}
        thresholds={thresholds}
      />
    </main>
  );
}
