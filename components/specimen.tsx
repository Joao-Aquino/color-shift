"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

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
  const caretMeasureRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const focusAtEnd = useRef(false);
  const composing = useRef(false);

  const updateCaret = useCallback(() => {
    const surface = surfaceRef.current;
    const input = inputRef.current;
    const mirror = caretMeasureRef.current;
    const caret = caretRef.current;
    if (!surface || !input || !mirror || !caret) return;
    caret.hidden = true;
    surface.removeAttribute("data-custom-caret");
    if (document.activeElement !== input || composing.current || input.selectionStart !== input.selectionEnd) return;

    // Preserve native editing/selection; measure a decorative caret in an
    // identical text layout. A final zero-width character gives empty lines
    // and the end of the text a measurable insertion point.
    mirror.textContent = `${input.value}\u200b`;
    mirror.style.fontSize = getComputedStyle(input).fontSize;
    mirror.style.width = `${input.clientWidth}px`;
    mirror.style.left = `${input.offsetLeft}px`;
    mirror.style.top = `${input.offsetTop - input.scrollTop}px`;
    const range = document.createRange();
    range.setStart(mirror.firstChild!, input.selectionStart);
    range.collapse(true);
    const point = range.getBoundingClientRect();
    const bounds = mirror.getBoundingClientRect();
    if (!point.height || !bounds.width) return;
    // Convert rendered bounds back into local coordinates if an ancestor is transformed.
    const scaleX = mirror.offsetWidth / bounds.width;
    const scaleY = mirror.offsetHeight / bounds.height;
    const size = parseFloat(mirror.style.fontSize);
    const height = size * 202 / 240;
    const x = input.offsetLeft + (point.left - bounds.left) * scaleX;
    const y = input.offsetTop - input.scrollTop + (point.top - bounds.top) * scaleY + (point.height * scaleY - height) / 2;
    caret.style.fontSize = `${size}px`;
    caret.style.transform = `translate(${x}px, ${y}px)`;
    const position = `${input.value}:${input.selectionStart}`;
    if (caret.dataset.position !== position) {
      caret.getAnimations().forEach(animation => { animation.currentTime = 0; });
      caret.dataset.position = position;
    }
    caret.hidden = false;
    surface.dataset.customCaret = "true";
  }, []);

  function moveToEnd() {
    const input = inputRef.current;
    if (!input) return;
    input.setSelectionRange(input.value.length, input.value.length);
    updateCaret();
  }

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
      updateCaret();
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
  }, [text, updateCaret]);

  useLayoutEffect(() => {
    document.addEventListener("selectionchange", updateCaret);
    return () => document.removeEventListener("selectionchange", updateCaret);
  }, [updateCaret]);

  return (
    <div
      ref={surfaceRef}
      className="cs-specimen-surface relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: background, color: foreground }}
    >
      <span ref={measureRef} aria-hidden className="cs-specimen-measure">{(text || "Aa") + "\u200b"}</span>
      <span ref={caretMeasureRef} aria-hidden className="cs-specimen-measure" />
      <span ref={caretRef} aria-hidden hidden className="cs-specimen-caret" data-specimen-caret />
      <textarea
        ref={inputRef}
        aria-label="Specimen text"
        className="cs-specimen-type"
        maxLength={120}
        onChange={event => onTextChange(event.target.value)}
        onPointerDown={() => { focusAtEnd.current = document.activeElement !== inputRef.current; }}
        onFocus={event => {
          if (event.currentTarget.selectionStart === event.currentTarget.selectionEnd) moveToEnd();
          else updateCaret();
        }}
        onClick={event => {
          if (focusAtEnd.current && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) moveToEnd();
          else updateCaret();
          focusAtEnd.current = false;
        }}
        onBlur={() => { focusAtEnd.current = false; updateCaret(); }}
        onSelect={updateCaret}
        onScroll={updateCaret}
        onCompositionStart={() => { composing.current = true; updateCaret(); }}
        onCompositionEnd={() => { composing.current = false; updateCaret(); }}
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
