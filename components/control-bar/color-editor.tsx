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
  format?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  fallbackHue?: number;
  onFallbackHueChange?: (hue: number) => void;
}

export function ColorEditor({
  color,
  target,
  onChange,
  onCommit,
  onGestureStart,
  onGestureEnd,
  format: formatProp,
  onFormatChange,
  fallbackHue: fallbackHueProp,
  onFallbackHueChange,
}: ColorEditorProps) {
  const [formatState, setFormatState] = useState<ColorFormat>("HEX");
  const [fallbackHueState, setFallbackHueState] = useState(0);

  const format = formatProp ?? formatState;
  const setFormat = onFormatChange ?? setFormatState;
  const fallbackHue = fallbackHueProp ?? fallbackHueState;
  const setFallbackHue = onFallbackHueChange ?? setFallbackHueState;

  const formatIndex = FORMATS.indexOf(format);
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
      data-color-editor
    >
      <Tabs
        onValueChange={(value) => setFormat(value as ColorFormat)}
        value={format}
      >
        <TabsList className="relative h-9 w-full rounded-full bg-[var(--color-chrome-raised)] p-1 group-data-horizontal/tabs:h-9">
          <span
            aria-hidden
            data-format-indicator
            className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-[var(--color-format-selected)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              width: `calc((100% - 0.5rem) / ${FORMATS.length})`,
              transform: `translateX(${formatIndex * 100}%)`,
            }}
          />
          {FORMATS.map((item) => (
            <TabsTrigger
              className="z-10 h-7 rounded-full bg-transparent px-1 text-[11px] font-medium text-[var(--color-text-muted)] transition-colors group-data-[variant=default]/tabs-list:data-active:shadow-none data-active:bg-transparent data-active:text-[var(--color-text-value)] data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
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
