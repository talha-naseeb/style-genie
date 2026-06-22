import { useRef, useState } from "react";
import { CATEGORIES, OUTFITS, type Category, type Outfit } from "@/lib/outfits";
import { cn } from "@/lib/utils";
import { Check, Upload, X } from "lucide-react";

export function OutfitGrid({
  selected,
  onSelect,
}: {
  selected: Outfit | null;
  onSelect: (o: Outfit) => void;
}) {
  const [cat, setCat] = useState<Category | "All" | "My uploads">("All");
  const [custom, setCustom] = useState<Outfit[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const items =
    cat === "All"
      ? [...custom, ...OUTFITS]
      : cat === "My uploads"
        ? custom
        : OUTFITS.filter((o) => o.category === cat);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next: Outfit[] = [];
    let pending = files.length;
    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith("image/")) {
        pending -= 1;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        next.push({
          id: `custom-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^.]+$/, "") || "My outfit",
          category: "Bridal",
          image: String(reader.result),
        });
        pending -= 1;
        if (pending === 0) {
          setCustom((c) => [...next, ...c]);
          setCat("My uploads");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeCustom(id: string) {
    setCustom((c) => c.filter((o) => o.id !== id));
    if (selected?.id === id) onSelect(null as unknown as Outfit);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(["All", ...CATEGORIES, "My uploads"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/60",
            )}
          >
            {c}
            {c === "My uploads" && custom.length > 0 && (
              <span className="ml-1 opacity-70">({custom.length})</span>
            )}
          </button>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 rounded-full border border-dashed border-primary/60 bg-card px-4 py-1.5 text-sm text-primary hover:bg-primary/5"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload your outfit
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {cat === "My uploads" && custom.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Upload product photos of your boutique's outfits to try them on. Flat front-facing shots
          (mannequin or hanger) give the most accurate results.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((o) => {
          const active = selected?.id === o.id;
          const isCustom = o.id.startsWith("custom-");
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-soft",
                active ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={o.image}
                  alt={o.name}
                  loading="lazy"
                  width={768}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {active && (
                  <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {isCustom && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remove outfit"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustom(o.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        removeCustom(o.id);
                      }
                    }}
                    className="absolute left-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">
                  {isCustom ? "My upload" : o.category}
                </p>
                <p className="text-sm font-medium leading-tight">{o.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
