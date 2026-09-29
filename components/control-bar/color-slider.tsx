"use client";

import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  formatChannelValue,
  parseChannelValue,
  type EditorChannel,
} from "@/lib/color/editor";

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
  const [draft, setDraft] = useState(() => formatChannelValue(channel));
  const [editing, setEditing] = useState(false);
  const cancelCommit = useRef(false);
  const gestureActive = useRef(false);
  const sliderLabelId = `slider-${channel.key}-label`;

  function startGesture() {
    if (gestureActive.current) return;
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
      setDraft(formatChannelValue(channel));
      return;
    }

    setDraft(
      formatChannelValue({
        ...channel,
        value,
      }),
    );
    if (Math.abs(value - channel.value) > channel.step / 2) {
      onDiscreteChange(value);
    }
  }

  return (
    <div className="flex h-9 items-center gap-2 rounded-full bg-[var(--color-chrome-raised)] px-3">
      <span
        className="w-[74px] shrink-0 text-xs font-medium text-[var(--color-text-muted)]"
        id={sliderLabelId}
      >
        {channel.label}
      </span>
      <div className="relative flex min-w-0 flex-1 items-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-2 rounded-full border border-white/10"
          style={{ background: gradient }}
        />
        <Slider
          aria-labelledby={sliderLabelId}
          className="relative z-10 [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-[url('/figma/handle-slider.svg')] [&_[data-slot=slider-thumb]]:bg-cover [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-transparent"
          max={channel.max}
          min={channel.min}
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
      <Input
        aria-label={`${channel.label} value`}
        className="h-7 w-14 rounded-full border-0 bg-black/20 px-2 text-right font-mono text-xs tabular-nums focus-visible:ring-1"
        inputMode={channel.display === "hex" ? "text" : "decimal"}
        onBlur={() => {
          if (cancelCommit.current) {
            cancelCommit.current = false;
          } else {
            commitDraft();
          }
          setEditing(false);
        }}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => {
          setDraft(formatChannelValue(channel));
          setEditing(true);
          event.currentTarget.select();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelCommit.current = true;
            event.currentTarget.blur();
          }
        }}
        spellCheck={false}
        value={editing ? draft : formatChannelValue(channel)}
      />
    </div>
  );
}
