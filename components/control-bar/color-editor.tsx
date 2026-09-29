"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getChannelGradient,
  getEditorChannels,
  updateColorChannel,
} from "@/lib/color/editor";
import type { ColorFormat, ColorTarget } from "@/types/color-shift";

import { ColorReadout } from "./color-readout";
import { ColorSlider } from "./color-slider";

const FORMATS: ColorFormat[] = ["HEX", "RGB", "HSL", "HSB", "OKLCH"];

interface ColorEditorProps {
  color: string;
  target: ColorTarget;
  onChange: (color: string) => void;
  onCommit: (color: string) => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
}

export function ColorEditor({
  color,
  target,
  onChange,
  onCommit,
  onGestureStart,
  onGestureEnd,
}: ColorEditorProps) {
  const [format, setFormat] = useState<ColorFormat>("HEX");
  const [fallbackHue, setFallbackHue] = useState(0);
  const channels = getEditorChannels(color, format, fallbackHue);

  function colorForChannel(key: (typeof channels)[number]["key"], value: number) {
    const nextColor = updateColorChannel(color, format, key, value, fallbackHue);
    const nextHue = getEditorChannels(nextColor, "HSL", fallbackHue).find(
      (channel) => channel.key === "h",
    )?.value;

    if (nextHue !== undefined && nextHue !== fallbackHue) {
      setFallbackHue(nextHue);
    }

    return nextColor;
  }

  function commitColor(nextColor: string) {
    const nextHue = getEditorChannels(nextColor, "HSL", fallbackHue).find(
      (channel) => channel.key === "h",
    )?.value;

    if (nextHue !== undefined && nextHue !== fallbackHue) {
      setFallbackHue(nextHue);
    }
    onCommit(nextColor);
  }

  return (
    <section
      aria-label={`Edit ${target} color`}
      className="rounded-[20px] border border-[var(--color-chrome-border)] bg-[var(--color-chrome-bg)] p-2"
      data-color-editor
    >
      <Tabs
        onValueChange={(value) => setFormat(value as ColorFormat)}
        value={format}
      >
        <TabsList className="h-9 w-full rounded-full bg-[var(--color-chrome-raised)] p-1">
          {FORMATS.map((item) => (
            <TabsTrigger
              className="h-7 rounded-full px-1 text-[11px] font-medium text-[var(--color-text-muted)] data-active:bg-[var(--color-chrome-border-strong)] data-active:text-[var(--color-text-value)]"
              key={item}
              value={item}
            >
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div
        className="mt-3 flex animate-in flex-col gap-1 fade-in duration-150"
        key={format}
      >
        {channels.map((channel) => (
          <ColorSlider
            channel={channel}
            gradient={getChannelGradient(
              color,
              format,
              channel.key,
              fallbackHue,
            )}
            key={`${format}-${channel.key}`}
            onChange={(value) => onChange(colorForChannel(channel.key, value))}
            onDiscreteChange={(value) =>
              onCommit(colorForChannel(channel.key, value))
            }
            onGestureEnd={onGestureEnd}
            onGestureStart={onGestureStart}
          />
        ))}
      </div>

      <div className="mt-3">
        <ColorReadout
          color={color}
          fallbackHue={fallbackHue}
          format={format}
          onCommit={commitColor}
        />
      </div>
    </section>
  );
}
