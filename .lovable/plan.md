
# Ladies Boutique Virtual Try-On — Pakistani Wears Demo

A standalone, frontend-only demo where shoppers upload a photo, pick a Pakistani outfit, and see themselves wearing it. AI runs through the Lovable AI Gateway (server-side) so no API keys are needed.

## User flow

1. **Landing** — boutique hero, tagline "See yourself in our collection", CTA "Start Try-On".
2. **Step 1 — Upload Photo** — drag-and-drop or file picker, helper text for best results.
3. **Step 1b — Smart Crop** — auto-suggests the best frame using the browser `FaceDetector` API (centered fallback if unavailable). User can drag/resize the crop box before confirming.
4. **Step 2 — Browse Outfits** — category tabs (Bridal, Formal Suits, Party Wear, Casual), grid of outfit cards, single-select.
5. **Step 3 — Generate** — "Generate My Look ✨" button → loading state "Styling you up… ✨".
6. **Result** — generated image with a **before/after compare slider** (original cropped photo vs generated try-on), plus Download, Share, WhatsApp, and "Try another outfit" buttons.

A persistent step indicator (1 → 2 → 3) sits at the top throughout.

## Outfit collection

12 AI-generated Pakistani outfit catalog images stored in `src/assets/outfits/`, distributed across 4 categories:

- **Bridal**: red/maroon bridal lehenga, gold zardozi bridal gown, pastel walima dress
- **Formal Suits**: printed lawn 3-piece, embroidered cotton shalwar kameez, chiffon formal suit
- **Party Wear**: sharara set, anarkali frock, peplum + cigarette pants
- **Casual**: kurta with jeans, plain lawn kurti, embroidered tunic

Each card: image, outfit name, category badge, "Select" state.

## AI integration (server-side, Lovable AI Gateway)

- Server route: `src/routes/api/try-on.ts` (POST) — accepts `{ userImage, outfitImage }` as base64 data URLs.
- Calls Lovable AI Gateway `/v1/chat/completions` with model `google/gemini-3-flash-image` (a.k.a. Nano Banana, image-in/image-out).
- Prompt: "You are a fashion AI for a Pakistani boutique. The first image is a person. The second image is a Pakistani outfit. Generate a realistic, flattering image of this person wearing this exact outfit. Preserve face, skin tone, and body. Keep the outfit's colors, embroidery, and design accurate. Studio lighting, full body when possible."
- Returns the generated image as a data URL.
- File is named `try-on.functions.ts`-style if using `createServerFn`, but image generation streams, so we use a **server route** (per TanStack image-gen guidance).
- Architecture is isolated in `src/lib/tryOnService.ts` (client-side caller) with a `// TODO: swap to Replicate IDM-VTON` comment for easy future migration.

## Auto-crop step

- After upload, the photo loads into a `<canvas>`. If `window.FaceDetector` exists, it detects the face and computes a waist-up crop box (face × ~6 height). Otherwise, suggest a centered 3:4 crop.
- A draggable/resizable crop overlay (built with simple pointer events, no extra library) lets the user adjust. Confirm button finalizes the cropped image used for AI.
- The cropped image is also kept aside for the before/after slider.

## Before/after compare slider

- Custom component (`<CompareSlider before={croppedUrl} after={generatedUrl} />`) — single draggable vertical divider that reveals the generated image over the original. Pointer + touch support, smooth `transform: translateX`. No external library.

## Share & download

- **Download**: anchor with `download` attribute pointing at the generated data URL.
- **WhatsApp**: `https://wa.me/?text=...` with the message "Look how I'd look in this outfit! 💃" (image attached via Web Share if supported; link-only fallback).
- **Web Share API**: `navigator.share({ files: [...] })` when available; gracefully hidden on desktop browsers without support.

## Design

- Palette: ivory `#FAF7F2`, warm beige `#E8DED2`, rose gold accent `#C9A96E`, deep charcoal text. Defined as semantic tokens in `src/styles.css` (`--background`, `--card`, `--primary`, etc.) so shadcn components inherit them. No hardcoded color classes.
- Type: **Playfair Display** (headings) + **Inter** (body), loaded via `<link>` in `src/routes/__root.tsx` and referenced through `@theme` font tokens in `src/styles.css`.
- Mobile-first; cards have soft shadow + hover lift; upload zone has dashed rose-gold border; result screen frames the generated image with a subtle gold border.
- Step indicator: pill-style stepper across the top of the flow routes.

## Routes

- `/` — landing
- `/try-on` — multi-step wizard (upload → crop → outfit → result) managed with local state + URL hash for step
- `__root.tsx` — head metadata, font links, `<Outlet />`

## Tech stack

- TanStack Start + React 19 + Tailwind v4 + shadcn/ui (already in template)
- Lovable AI Gateway via `fetch` from a server route (no extra packages needed for image gen)
- Browser `FaceDetector` API + custom crop overlay (no deps)
- No database, no auth, no Lovable Cloud — fully session-only

## Out of scope (per your answers)

- Persisting generated images to a gallery
- User accounts
- Real Replicate IDM-VTON wiring (stub left in service file with TODO)

## File layout

```text
src/
  routes/
    __root.tsx              (fonts, head)
    index.tsx               (landing)
    try-on.tsx              (wizard host)
    api/try-on.ts           (Gemini image gen server route)
  components/
    StepIndicator.tsx
    PhotoUpload.tsx
    SmartCrop.tsx           (face detect + drag/resize crop)
    OutfitGrid.tsx
    OutfitCard.tsx
    GeneratingState.tsx
    CompareSlider.tsx
    ShareActions.tsx
  lib/
    tryOnService.ts         (client caller, // TODO: Replicate IDM-VTON)
    outfits.ts              (12-item catalog with imports)
  assets/outfits/           (12 generated outfit images)
  styles.css                (tokens + @theme)
```
