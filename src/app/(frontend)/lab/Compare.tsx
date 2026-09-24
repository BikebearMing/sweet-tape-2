"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

/* A screenshot of the design laid over the live section and cut at a line: the
   comp to the LEFT of it, the render to the RIGHT. Paste an image (Figma's
   "copy as PNG", then Cmd+V on the page) or pick a file; `src` is a file in
   public/lab that loads on its own if it is there.

   Laid at the host's top left at the host's width, so a screenshot of the
   whole artboard lines up with nothing to set; `y` nudges it when the crop is
   not the artboard. One line in any lab: <Compare into=".the-section" />. */
export default function Compare({ into, src: initial }: { into: string; src?: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [src, setSrc] = useState<string | null>(initial ?? null);
  const [split, setSplit] = useState(50);
  const [opacity, setOpacity] = useState(100);
  const [y, setY] = useState(0);

  useEffect(() => setHost(document.querySelector<HTMLElement>(into)), [into]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (f) setSrc(URL.createObjectURL(f));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const pick = (f?: File) => f && setSrc(URL.createObjectURL(f));

  return (
    <>
      <div style={bar}>
        <label>
          comp <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <span>(or paste)</span>
        <label>
          split <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} />
        </label>
        <label>
          opacity <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
        </label>
        <label>
          y <input type="number" step={0.1} value={y} onChange={(e) => setY(+e.target.value || 0)} style={{ width: 56 }} />
          vw
        </label>
      </div>
      {host &&
        src &&
        createPortal(
          <>
            <div style={{ ...clip, clipPath: `inset(0 ${100 - split}% 0 0)`, opacity: opacity / 100 }}>
              <img src={src} alt="" style={{ ...img, translate: `0 ${y}vw` }} onError={() => setSrc(null)} />
            </div>
            <div style={{ ...line, left: `${split}%` }} />
          </>,
          host,
        )}
    </>
  );
}

const bar: CSSProperties = {
  position: "fixed",
  left: 8,
  bottom: 8,
  zIndex: 1000,
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "6px 10px",
  background: "rgba(255,255,255,.94)",
  color: "#111",
  font: "12px/1.4 ui-monospace, monospace",
  borderRadius: 8,
  boxShadow: "0 4px 24px rgba(0,0,0,.25)",
};
const clip: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  pointerEvents: "none",
};
const img: CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
};
const line: CSSProperties = {
  position: "absolute",
  top: 0,
  bottom: 0,
  zIndex: 11,
  pointerEvents: "none",
  borderLeft: "2px dashed #f0f",
};
