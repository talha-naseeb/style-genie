import { useState } from "react";
import { CATEGORIES, OUTFITS, type Category, type Outfit } from "@/lib/outfits";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function OutfitGrid({
  selected,
  onSelect,
}: {
  selected: Outfit | null;
  onSelect: (o: Outfit) => void;
}) {
  const [cat, setCat] = useState<Category | "All">("All");
  const items = OUTFITS.filter((o) => cat === "All" || o.category === cat);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
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
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((o) => {
          const active = selected?.id === o.id;
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
              </div>
              <div className="space-y-1 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">{o.category}</p>
                <p className="text-sm font-medium leading-tight">{o.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
