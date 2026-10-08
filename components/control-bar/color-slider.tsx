"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  formatChannelValue,
  parseChannelValue,
  type EditorChannel,
} from "@/lib/color/editor";
import { motionValue, prefersReducedMotion } from "@/lib/motion";

interface ColorSliderProps {
  channel: EditorChannel;
  gradient: string;
  onChange: (value: number) => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onDiscreteChange: (value: number) => void;
}

const SLIDER_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

export function ColorSlider({
  channel,
  gradient,
  onChange,
  onGestureStart,
  onGestureEnd,
  onDiscreteChange,
}: ColorSliderProps) {
  const formatted = formatChannelValue(channel);
  const [draft, setDraft] = useState(formatted);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelCommit = useRef(false);
  const gestureActive = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const motion = useRef<gsap.core.Tween | null>(null);
  const position = useRef<number | null>(null);
  const directChange = useRef(false);
  const sliderLabelId = `slider-${channel.key}-label`;

  function stopMotion() {
    motion.current?.kill();
    const track = trackRef.current;
    const thumb = trackRef.current?.querySelector<HTMLElement>("[data-slot=slider-thumb]");
    if (thumb) gsap.set(thumb, { clearProps: "transform" });
    position.current = thumb && track ? thumb.getBoundingClientRect().left - track.getBoundingClientRect().left : null;
  }

  useLayoutEffect(() => {
    const track = trackRef.current;
    const thumb = track?.querySelector<HTMLElement>("[data-slot=slider-thumb]");
    if (!track || !thumb) return;
    const from = position.current;
    motion.current?.kill();
    gsap.set(thumb, { clearProps: "transform" });
    const finalPosition = thumb.getBoundingClientRect().left - track.getBoundingClientRect().left;
    if (from === null || gestureActive.current || directChange.current || prefersReducedMotion()) {
      directChange.current = false;
      position.current = finalPosition;
      return;
    }
    motion.current = gsap.fromTo(thumb, { x: from - finalPosition }, {
      x: 0,
      duration: motionValue("--color-duration"),
      ease: "power4.inOut",
      onUpdate: () => { position.current = finalPosition + Number(gsap.getProperty(thumb, "x")); },
      onComplete: () => { position.current = finalPosition; gsap.set(thumb, { clearProps: "transform" }); },
    });
  }, [channel.value, channel.min, channel.max]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new ResizeObserver(stopMotion);
    if (trackRef.current) observer.observe(trackRef.current);
    reduced.addEventListener("change", stopMotion);
    return () => {
      motion.current?.kill();
      reduced.removeEventListener("change", stopMotion);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setDraft(formatted);
  }, [formatted]);

  function startGesture() {
    if (gestureActive.current) return;
    stopMotion();
    gestureActive.current = true;
    onGestureStart();
  }

  function finishGesture() {
    if (!gestureActive.current) return;
    gestureActive.current = false;
    onGestureEnd();
  }

  function commitDraft() {
    const value = parseChannelValue(draft, channel);
    if (value === null) {
      setDraft(formatted);
      return;
    }

    setDraft(
      formatChannelValue({
        ...channel,
        value,
      }),
    );
    if (Math.abs(value - channel.value) > channel.step / 2) {
      directChange.current = true;
      onDiscreteChange(value);
    }
  }

  return (
    <div className="flex h-9 items-center gap-2 rounded-full bg-[var(--color-chrome-raised)] pr-2 pl-3">
      <span
        className="w-[74px] shrink-0 text-xs font-medium text-[var(--color-text-muted)]"
        id={sliderLabelId}
      >
        {channel.label}
      </span>
      <div ref={trackRef} className="relative flex min-w-0 flex-1 items-center" data-color-slider={channel.key}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-2 rounded-full"
          style={{ background: gradient }}
        />
        <Slider
          aria-labelledby={sliderLabelId}
          className="relative z-10 [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-transparent [&_[data-slot=slider-thumb]]:bg-[url('/figma/handle-slider.svg')] [&_[data-slot=slider-thumb]]:bg-cover [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-transparent"
          max={channel.max}
          min={channel.min}
          onPointerDownCapture={startGesture}
          onPointerCancel={finishGesture}
          onBlur={finishGesture}
          onKeyDown={(event) => {
            if (SLIDER_KEYS.has(event.key)) startGesture();
          }}
          onKeyUp={(event) => {
            if (SLIDER_KEYS.has(event.key)) finishGesture();
          }}
          onValueChange={([value]) => {
            startGesture();
            onChange(value);
          }}
          onValueCommit={finishGesture}
          step={channel.step}
          value={[channel.value]}
        />
      </div>
      <div className="h-7 w-14 shrink-0">
        <Input
          aria-label={`${channel.label} value`}
          className="h-7 w-14 rounded-full border-0 bg-transparent px-2 text-right font-mono text-xs text-[var(--color-text-value)] tabular-nums focus-visible:ring-1 md:text-xs dark:bg-transparent"
          inputMode={channel.display === "hex" ? "text" : "decimal"}
          onBlur={() => {
            if (cancelCommit.current) {
              cancelCommit.current = false;
              setDraft(formatted);
            } else {
              commitDraft();
            }
          }}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => {
            setDraft(formatted);
            event.currentTarget.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              cancelCommit.current = true;
              event.currentTarget.blur();
            }
          }}
          ref={inputRef}
          spellCheck={false}
          value={draft}
        />
      </div>
    </div>
  );
}
