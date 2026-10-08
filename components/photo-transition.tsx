"use client";

import gsap from "gsap";
import Image from "next/image";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { motionValue, prefersReducedMotion } from "@/lib/motion";
import type { Photo } from "@/types/color-shift";

interface Layer {
  photo: Photo;
  key: number;
}

function PhotoLayer({ layer, active, initial, onReady }: {
  layer: Layer;
  active: boolean;
  initial: boolean;
  onReady: (key: number) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const reveal = useRef<gsap.core.Tween | null>(null);
  const { photo, key } = layer;

  useLayoutEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function settle() {
      if (!query.matches || !imageRef.current?.complete) return;
      reveal.current?.kill();
      gsap.set(imageRef.current, { opacity: 1 });
    }
    query.addEventListener("change", settle);
    return () => {
      reveal.current?.kill();
      query.removeEventListener("change", settle);
    };
  }, []);

  return (
    <div className="cs-photo-layer" data-photo-layer={key} data-photo-id={photo.id} data-current={active} aria-hidden={!active} style={{ opacity: initial ? 1 : 0, backgroundColor: photo.color }}>
      <Image
        alt=""
        aria-hidden
        className="object-cover [image-rendering:pixelated]"
        data-photo-placeholder
        fill
        loading="eager"
        onLoad={() => onReady(key)}
        onError={event => { event.currentTarget.style.visibility = "hidden"; }}
        sizes="32px"
        src={photo.tinyUrl}
        unoptimized
      />
      <Image
        alt={active ? photo.alt : ""}
        className="object-cover"
        data-photo-full
        fill
        loading="eager"
        onLoad={() => {
          onReady(key);
          reveal.current?.kill();
          reveal.current = gsap.to(imageRef.current, { opacity: 1, duration: prefersReducedMotion() ? 0 : motionValue("--photo-duration"), ease: "power4.out" });
        }}
        onError={event => {
          event.currentTarget.style.visibility = "hidden";
          onReady(key);
        }}
        quality={90}
        ref={imageRef}
        sizes="(min-width: 1180px) 38vw, 50vw"
        src={photo.url}
        style={{ opacity: 0 }}
        unoptimized={photo.source === "local"}
      />
    </div>
  );
}

export function PhotoTransition({ photo }: { photo: Photo }) {
  const [state, setState] = useState({ id: photo.id, sequence: 0, layers: [{ photo, key: 0 }] });
  const rootRef = useRef<HTMLDivElement>(null);
  const animation = useRef<gsap.core.Timeline | null>(null);
  const active = useRef(0);
  const ready = useRef(new Set<number>());
  const revealed = useRef<number | null>(null);

  // Keep every partially visible layer until the latest transition settles.
  if (state.id !== photo.id) {
    const sequence = state.sequence + 1;
    setState({ id: photo.id, sequence, layers: [...state.layers, { photo, key: sequence }] });
  }

  const reveal = useCallback((key: number, force = false) => {
    ready.current.add(key);
    const root = rootRef.current;
    if (!root || key !== active.current || (!force && revealed.current === key)) return;
    const incoming = root.querySelector<HTMLElement>(`[data-photo-layer="${key}"]`);
    if (!incoming) return;
    revealed.current = key;
    const outgoing = Array.from(root.querySelectorAll<HTMLElement>("[data-photo-layer]")).filter(node => node !== incoming);
    animation.current?.kill();
    if (!outgoing.length) {
      gsap.set(incoming, { opacity: 1 });
      return;
    }
    const duration = prefersReducedMotion() ? 0 : motionValue("--photo-duration");
    animation.current = gsap.timeline({ onComplete: () => {
      if (active.current !== key) return;
      ready.current = new Set([key]);
      setState(current => ({ ...current, layers: current.layers.filter(layer => layer.key === key) }));
    } })
      // Keep the previous blend opaque underneath; fading both would dim the photo.
      .to(incoming, { opacity: 1, duration, ease: "power4.out" }, 0);
  }, []);

  useLayoutEffect(() => {
    animation.current?.kill();
    active.current = state.sequence;
    const incoming = rootRef.current?.querySelector<HTMLElement>(`[data-photo-layer="${state.sequence}"]`);
    if (incoming && state.layers.length > 1) gsap.set(incoming, { opacity: motionValue("--photo-opacity") });
    if (ready.current.has(state.sequence)) reveal(state.sequence);
  }, [state.sequence, state.layers.length, reveal]);

  useLayoutEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function settle() {
      if (query.matches && ready.current.has(active.current)) reveal(active.current, true);
    }
    query.addEventListener("change", settle);
    return () => {
      animation.current?.kill();
      query.removeEventListener("change", settle);
    };
  }, [reveal]);

  return (
    <div ref={rootRef} className="absolute inset-0" data-photo-transition>
      {state.layers.map(layer => <PhotoLayer key={layer.key} layer={layer} active={layer.key === state.sequence} initial={layer.key === 0} onReady={reveal} />)}
    </div>
  );
}
