import { useCallback, useRef, useState } from "react";

export function CompareSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0.5);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    setPos(p);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-[3/4] w-full max-w-sm select-none overflow-hidden rounded-2xl border border-primary/30 bg-muted shadow-soft"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* After image (full) */}
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* Before image (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos * 100}%` }}>
        <div className="relative h-full" style={{ width: wrapRef.current?.clientWidth ?? "100%" }}>
          <img src={before} alt="Before" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
      </div>
      {/* Labels */}
      <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur">
        {afterLabel}
      </span>
      {/* Divider + handle */}
      <div
        className="pointer-events-none absolute top-0 h-full w-px bg-primary"
        style={{ left: `${pos * 100}%` }}
      />
      <div
        className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-background shadow-lg"
        style={{ left: `${pos * 100}%`, top: "50%" }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" />
        </svg>
      </div>
    </div>
  );
}
