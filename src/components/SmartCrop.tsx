import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FaceDetectorCtor {
  new (opts?: { fastMode?: boolean }): {
    detect: (img: HTMLImageElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
  };
}

const ASPECT = 3 / 4; // portrait

async function detectFace(img: HTMLImageElement): Promise<Box | null> {
  const FD = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  if (!FD) return null;
  try {
    const detector = new FD({ fastMode: true });
    const faces = await detector.detect(img);
    if (!faces?.length) return null;
    const f = faces[0].boundingBox;
    return { x: f.x, y: f.y, w: f.width, h: f.height };
  } catch {
    return null;
  }
}

function suggestCrop(img: HTMLImageElement, face: Box | null): Box {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (face) {
    // Waist-up frame: ~7x face height, ~5x face width, face in upper third.
    const h = Math.min(ih, face.h * 7);
    const w = Math.min(iw, h * ASPECT);
    const cx = face.x + face.w / 2;
    let x = cx - w / 2;
    let y = face.y - face.h * 0.8;
    x = Math.max(0, Math.min(iw - w, x));
    y = Math.max(0, Math.min(ih - h, y));
    return { x, y, w, h };
  }
  // Centered 3:4
  let w = iw;
  let h = w / ASPECT;
  if (h > ih) {
    h = ih;
    w = h * ASPECT;
  }
  return { x: (iw - w) / 2, y: (ih - h) / 2, w, h };
}

type Handle = "move" | "nw" | "ne" | "sw" | "se" | null;

export function SmartCrop({
  src,
  onConfirm,
  onBack,
}: {
  src: string;
  onConfirm: (croppedDataUrl: string) => void;
  onBack: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [detected, setDetected] = useState(false);
  const [scale, setScale] = useState(1); // displayed-px per natural-px
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startBox: Box;
  } | null>(null);

  // On image load: detect + suggest
  const onLoad = async () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    const face = await detectFace(img);
    setDetected(!!face);
    setBox(suggestCrop(img, face));
  };

  // Compute scale on layout
  useEffect(() => {
    const update = () => {
      const img = imgRef.current;
      if (!img || !natural) return;
      setScale(img.clientWidth / natural.w);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [natural, src]);

  function onPointerDown(e: React.PointerEvent, handle: Handle) {
    if (!box) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !natural) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    let { x, y, w, h } = d.startBox;
    if (d.handle === "move") {
      x = Math.max(0, Math.min(natural.w - w, x + dx));
      y = Math.max(0, Math.min(natural.h - h, y + dy));
    } else {
      // Resize keeping ASPECT
      const fixedRight = d.handle === "nw" || d.handle === "sw";
      const fixedBottom = d.handle === "nw" || d.handle === "ne";
      const signX = d.handle === "ne" || d.handle === "se" ? 1 : -1;
      const signY = d.handle === "sw" || d.handle === "se" ? 1 : -1;
      let nw = w + signX * dx;
      nw = Math.max(80, nw);
      let nh = nw / ASPECT;
      // Anchor opposite corner
      const anchorX = fixedRight ? x + w : x;
      const anchorY = fixedBottom ? y + h : y;
      let nx = signX === 1 ? anchorX : anchorX - nw;
      let ny = signY === 1 ? anchorY : anchorY - nh;
      // Clamp
      if (nx < 0) {
        nw += nx;
        nh = nw / ASPECT;
        nx = 0;
        ny = signY === 1 ? anchorY : anchorY - nh;
      }
      if (ny < 0) {
        nh += ny;
        nw = nh * ASPECT;
        ny = 0;
        nx = signX === 1 ? anchorX : anchorX - nw;
      }
      if (nx + nw > natural.w) {
        nw = natural.w - nx;
        nh = nw / ASPECT;
      }
      if (ny + nh > natural.h) {
        nh = natural.h - ny;
        nw = nh * ASPECT;
      }
      x = nx;
      y = ny;
      w = nw;
      h = nh;
    }
    setBox({ x, y, w, h });
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !box) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(box.w);
    canvas.height = Math.round(box.h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
    onConfirm(canvas.toDataURL("image/jpeg", 0.92));
  }

  async function reset() {
    const img = imgRef.current;
    if (!img) return;
    const face = await detectFace(img);
    setBox(suggestCrop(img, face));
  }

  // Compute overlay rect in display pixels
  const display = box && scale ? { x: box.x * scale, y: box.y * scale, w: box.w * scale, h: box.h * scale } : null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-2xl">Frame your photo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {detected
            ? "We detected your face and suggested the best frame. Drag to adjust."
            : "Drag and resize the frame to fit your photo."}
        </p>
      </div>

      <div
        ref={wrapRef}
        className="relative mx-auto max-w-md overflow-hidden rounded-2xl bg-muted shadow-soft"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Your upload"
          onLoad={onLoad}
          className="block w-full select-none"
          draggable={false}
        />
        {display && (
          <>
            {/* dim outside */}
            <div className="pointer-events-none absolute inset-0 bg-foreground/40" />
            {/* clear window */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: display.x,
                top: display.y,
                width: display.w,
                height: display.h,
                boxShadow: "0 0 0 9999px transparent",
                outline: "2px solid var(--gold)",
              }}
            >
              <img
                src={src}
                alt=""
                aria-hidden
                className="pointer-events-none absolute max-w-none select-none"
                draggable={false}
                style={{
                  width: natural ? natural.w * scale : 0,
                  height: natural ? natural.h * scale : 0,
                  left: -display.x,
                  top: -display.y,
                }}
              />
            </div>
            {/* move surface */}
            <div
              className="absolute cursor-move"
              style={{ left: display.x, top: display.y, width: display.w, height: display.h }}
              onPointerDown={(e) => onPointerDown(e, "move")}
            />
            {/* corner handles */}
            {(["nw", "ne", "sw", "se"] as const).map((c) => {
              const cx = c.includes("e") ? display.x + display.w : display.x;
              const cy = c.includes("s") ? display.y + display.h : display.y;
              return (
                <div
                  key={c}
                  onPointerDown={(e) => onPointerDown(e, c)}
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-background bg-primary shadow"
                  style={{ left: cx, top: cy, cursor: c === "ne" || c === "sw" ? "nesw-resize" : "nwse-resize" }}
                />
              );
            })}
          </>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onBack}>
          Re-upload
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Auto suggest
        </Button>
        <Button onClick={confirm}>
          <Sparkles className="mr-1 h-4 w-4" />
          Use this frame
        </Button>
      </div>
    </div>
  );
}
