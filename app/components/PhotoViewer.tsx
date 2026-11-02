"use client";

import { useEffect, useState } from "react";

const MIN = 1;
const MAX = 5;

// A photo thumbnail; click it to open full screen, then zoom in and out with
// the buttons, the mouse wheel, or a double click. Scroll to move around.
export default function PhotoViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const zoom = (change: number) =>
    setScale((s) => Math.min(MAX, Math.max(MIN, +(s + change).toFixed(2))));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") zoom(0.5);
      if (e.key === "-") zoom(-0.5);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setScale(1);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Click to zoom"
        title="Click to zoom"
        onClick={() => setOpen(true)}
        className="w-full cursor-zoom-in rounded-lg object-cover"
      />

      {open && (
        <div className="fixed inset-0 z-50 bg-black/85">
          <div
            className="h-full w-full overflow-auto"
            onWheel={(e) => zoom(e.deltaY < 0 ? 0.25 : -0.25)}
            onClick={() => scale === 1 && close()}
          >
            <div className="flex min-h-full min-w-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Full size"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={() => setScale(scale > 1 ? 1 : 2.5)}
                style={{
                  width: `${scale * 100}%`,
                  maxWidth: scale === 1 ? "95vw" : "none",
                  maxHeight: scale === 1 ? "90vh" : "none",
                }}
                className="rounded-lg object-contain"
              />
            </div>
          </div>

          <div className="fixed right-4 top-4 flex gap-2">
            {[
              { label: "−", title: "Zoom out", onClick: () => zoom(-0.5) },
              { label: "+", title: "Zoom in", onClick: () => zoom(0.5) },
              { label: "Reset", title: "Reset zoom", onClick: () => setScale(1) },
              { label: "✕", title: "Close", onClick: close },
            ].map((b) => (
              <button
                key={b.title}
                type="button"
                title={b.title}
                aria-label={b.title}
                onClick={b.onClick}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#353b32] hover:bg-white"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
