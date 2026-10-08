"use client";

import { useLayoutEffect, useRef } from "react";

interface SpecimenProps {
  background: string;
  foreground: string;
  text: string;
  onTextChange: (text: string) => void;
}

export function Specimen({ background, foreground, text, onTextChange }: SpecimenProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const input = inputRef.current;
    const measure = measureRef.current;
    if (!surface || !input || !measure) return;
    let disposed = false;

    function fit() {
      if (disposed || !surface || !input || !measure) return;
      const maximum = parseFloat(getComputedStyle(surface).getPropertyValue("--specimen-font-size"));
      const availableHeight = surface.clientHeight * 0.65;
      // Measure identical wrapping without changing the textarea or caret.
      measure.style.fontSize = `${maximum}px`;
      const fitsMaximum = measure.offsetHeight <= availableHeight && measure.scrollWidth <= measure.clientWidth + 1;
      let low = fitsMaximum ? maximum : 1;
      let high = maximum;
      for (let step = 0; !fitsMaximum && step < 10; step += 1) {
        const size = (low + high) / 2;
        measure.style.fontSize = `${size}px`;
        if (measure.offsetHeight <= availableHeight && measure.scrollWidth <= measure.clientWidth + 1) low = size;
        else high = size;
      }
      const size = Math.floor(low * 10) / 10;
      measure.style.fontSize = `${size}px`;
      input.style.fontSize = `${size}px`;
      input.style.height = `${Math.ceil(measure.getBoundingClientRect().height) + 2}px`;
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(surface);
    window.addEventListener("resize", fit);
    document.fonts.addEventListener("loadingdone", fit);
    void document.fonts.ready.then(fit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", fit);
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [text]);

  return (
    <div
      ref={surfaceRef}
      data-responsive-motion="specimen"
      className="cs-specimen-surface relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: background, color: foreground }}
    >
      <span ref={measureRef} aria-hidden className="cs-specimen-measure">{(text || "Aa") + "\u200b"}</span>
      <textarea
        ref={inputRef}
        aria-label="Specimen text"
        className="cs-specimen-type"
        data-responsive-motion="type"
        maxLength={120}
        onChange={event => onTextChange(event.target.value)}
        onKeyDown={event => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.blur();
        }}
        placeholder="Aa"
        rows={1}
        spellCheck={false}
        value={text}
      />
    </div>
  );
}
