"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ControlContainer } from "@/components/control-bar/control-container";
import { CSButton } from "@/components/control-bar/cs-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContrastScore } from "@/lib/color/contrast";
import { createFallbackPair, extractColorPair } from "@/lib/color/palette";
import { fetchPhotos } from "@/lib/photos/client";
import type { ColorPair, Photo } from "@/types/color-shift";

const INITIAL_BUFFER_SIZE = 10;
const REFILL_THRESHOLD = 3;

interface PhotoEntry {
  photo: Photo;
  pair: ColorPair | null;
}

function LoadingPanel({ className = "" }: { className?: string }) {
  return (
    <Skeleton
      className={`h-full min-w-0 flex-1 rounded-none bg-[var(--color-panel-loading)] ${className}`}
    />
  );
}

export function ColorShiftApp() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [showCircle, setShowCircle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const entriesRef = useRef(entries);
  const indexRef = useRef(index);
  const refillInFlight = useRef(false);
  const requestInFlight = useRef(false);

  const updateEntries = useCallback(
    (updater: (current: PhotoEntry[]) => PhotoEntry[]) => {
      setEntries((current) => {
        const next = updater(current);
        entriesRef.current = next;
        return next;
      });
    },
    [],
  );

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
    setIndex((current) => {
      const next = Math.max(0, current - 1);
      indexRef.current = next;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => {
      const lastIndex = Math.max(0, entriesRef.current.length - 1);
      const next = Math.min(lastIndex, current + 1);
      indexRef.current = next;
      return next;
    });
  }, []);

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
      processPhotos([photo]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load a new photo.",
      );
    } finally {
      requestInFlight.current = false;
      setIsRequesting(false);
    }
  }, [processPhotos, updateEntries]);

  const swapColors = useCallback(() => {
    const currentId = entriesRef.current[indexRef.current]?.photo.id;
    if (!currentId) return;

    updateEntries((current) =>
      current.map((entry) => {
        if (entry.photo.id !== currentId || !entry.pair) return entry;

        return {
          ...entry,
          pair: {
            ...entry.pair,
            background: entry.pair.foreground,
            foreground: entry.pair.background,
            originalForeground: entry.pair.background,
            wasBumped: false,
          },
        };
      }),
    );
  }, [updateEntries]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

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
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, shuffle, swapColors]);

  const current = entries[index];
  const pair = current?.pair ?? null;
  const score = pair
    ? getContrastScore(pair.foreground, pair.background)
    : null;
  const ready = !!current && !!pair;

  return (
    <main className="flex h-screen min-h-[720px] min-w-[1180px] gap-12 overflow-hidden bg-[var(--color-chrome-bg)] p-10">
      <ControlContainer
        background={pair?.background ?? null}
        canGoNext={index < entries.length - 1}
        canGoPrevious={index > 0}
        disabled={!ready || isRequesting}
        foreground={pair?.foreground ?? null}
        onNext={goNext}
        onPrevious={goPrevious}
        onShuffle={() => void shuffle()}
        onSwap={swapColors}
        score={score}
      />

      <div className="flex min-w-0 flex-1 gap-1 overflow-hidden rounded-[12px]">
        {ready ? (
          <button
            aria-label={showCircle ? "Show Aa specimen" : "Show circle specimen"}
            className="group flex h-full min-w-0 flex-1 cursor-pointer items-center justify-center overflow-hidden transition-colors duration-300 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current"
            onClick={() => setShowCircle((currentValue) => !currentValue)}
            style={{ backgroundColor: pair.background, color: pair.foreground }}
            type="button"
          >
            {showCircle ? (
              <span
                aria-hidden
                className="aspect-square w-[min(240px,52%)] rounded-full bg-current transition-[transform,opacity] duration-200 group-active:scale-95"
              />
            ) : (
              <span className="text-[220px] leading-none font-medium transition-[transform,opacity] duration-200 group-active:scale-95">
                Aa
              </span>
            )}
          </button>
        ) : (
          <LoadingPanel />
        )}

        <section
          aria-label="Source photo"
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
                priority={index === 0}
                sizes="(min-width: 1180px) 38vw, 50vw"
                src={current.photo.url}
              />
              <p className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-[4px] bg-black/80 px-2 py-1 text-xs backdrop-blur-sm">
                <span className="tracking-[0.04em] text-[var(--color-text-label)] uppercase">
                  Photo
                </span>
                <a
                  className="text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={current.photo.photographerUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {current.photo.photographer}
                </a>
                <span className="text-[var(--color-text-label)]">on</span>
                <a
                  className="text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={current.photo.photoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Unsplash
                </a>
              </p>
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
    </main>
  );
}
