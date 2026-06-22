import { createFileRoute } from "@tanstack/react-router";

// Lovable AI Gateway image generation via google/gemini-3.1-flash-image (Nano Banana 2).
// Accepts a user photo and an outfit image, returns a generated try-on image.

interface Body {
  userImage: string;
  outfitImage: string;
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  // Fetch absolute URL outfit and inline as data URL
  const r = await fetch(src);
  const buf = new Uint8Array(await r.arrayBuffer());
  const ct = r.headers.get("content-type") || "image/jpeg";
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const b64 = btoa(bin);
  return `data:${ct};base64,${b64}`;
}

export const Route = createFileRoute("/api/try-on")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json(
            { type: "config_error", title: "Server misconfiguration", message: "The AI service is not configured. Please contact support.", recoverable: false },
            { status: 500 },
          );
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json(
            { type: "bad_request", title: "Invalid request", message: "The request body could not be read. Please refresh and try again.", recoverable: true },
            { status: 400 },
          );
        }
        if (!body?.userImage || !body?.outfitImage) {
          return Response.json(
            { type: "bad_request", title: "Missing images", message: "Please upload your photo and select an outfit before generating.", recoverable: true },
            { status: 400 },
          );
        }

        let userImage: string;
        let outfitImage: string;
        try {
          userImage = await toDataUrl(body.userImage);
          outfitImage = await toDataUrl(body.outfitImage);
        } catch {
          return Response.json(
            { type: "bad_request", title: "Image load failed", message: "We couldn't read one of the images. Try a different photo or outfit.", recoverable: true },
            { status: 400 },
          );
        }

        const prompt =
          "TASK: Virtual try-on for a Pakistani ladies boutique.\n\n" +
          "You are given TWO reference images:\n" +
          "• IMAGE 1 = THE OUTFIT (garment reference). This is the EXACT garment that must appear in the output. Treat it as a product photo — copy every visible detail: colors (do not shift hue or saturation), fabric texture, embroidery, prints, motifs, beadwork, neckline, sleeve length and cut, hemline, dupatta (with its print/border), and overall silhouette. Do NOT substitute, recolor, simplify, restyle, or invent a different outfit. If the outfit has a dupatta, include the dupatta. If it has specific embroidery placement, replicate it in the same place.\n" +
          "• IMAGE 2 = THE CUSTOMER (identity reference). Copy the customer's face, hair, skin tone and body pixel-accurately. Same facial features, eyes, nose, lips, jawline, eyebrows, makeup, hairstyle and hair color. Do NOT beautify, slim, lighten or alter the face. Keep the same body type and proportions.\n\n" +
          "COMPOSITE RULES:\n" +
          "1. Dress the person from IMAGE 2 in the EXACT outfit from IMAGE 1. The garment in the output must be visually identical to IMAGE 1 — a viewer comparing both should say 'that is the same outfit'.\n" +
          "2. Drape the outfit naturally with realistic folds, shadows and physics on the customer's body.\n" +
          "3. Full-body or three-quarter portrait so the whole outfit is visible. Clean studio lighting, soft neutral background (light beige or off-white).\n" +
          "4. Photorealistic, sharp, no artifacts, no extra limbs, no warped hands, no text or watermarks.\n\n" +
          "OUTPUT: Return ONLY the final composite image. No collage, no variations, no side-by-side.";


        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "raw-fetch",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: "IMAGE 1 — THE OUTFIT to reproduce exactly (same colors, fabric, embroidery, dupatta, neckline, sleeves, silhouette). This is the garment that must appear in the final image:" },
                    { type: "image_url", image_url: { url: outfitImage } },
                    { type: "text", text: "IMAGE 2 — THE CUSTOMER whose face, hair, skin tone and body must be preserved exactly:" },
                    { type: "image_url", image_url: { url: userImage } },
                    { type: "text", text: prompt },
                  ],
                },
              ],
              modalities: ["image", "text"],

            }),
          });

        } catch {
          return Response.json(
            { type: "network", title: "Connection failed", message: "We couldn't reach the AI service. Check your internet connection and try again.", recoverable: true },
            { status: 503 },
          );
        }

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          let parsed: { message?: string } | undefined;
          try { parsed = JSON.parse(txt); } catch { /* no-op */ }

          if (upstream.status === 429) {
            return Response.json(
              { type: "rate_limit", title: "Too busy", message: "Our AI stylist is in high demand right now. Please wait a moment and try again.", recoverable: true },
              { status: 429 },
            );
          }
          if (upstream.status === 402) {
            return Response.json(
              { type: "credits_exhausted", title: "Credits exhausted", message: "AI generation credits have run out. Please add credits to your workspace to continue.", recoverable: false },
              { status: 402 },
            );
          }
          return Response.json(
            { type: "gateway_error", title: "AI service error", message: parsed?.message || "Something went wrong with the AI service. Please try again in a moment.", recoverable: true },
            { status: upstream.status },
          );
        }

        const rawText = await upstream.text();
        let data: {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
              content?: unknown;
            };
          }>;
        } = {};
        try { data = JSON.parse(rawText); } catch { /* keep empty */ }

        const msg = data?.choices?.[0]?.message;
        let url: string | undefined = msg?.images?.[0]?.image_url?.url;

        if (!url && typeof msg?.content === "string") {
          const m = msg.content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
          if (m) url = m[0];
        } else if (!url && Array.isArray(msg?.content)) {
          for (const part of msg.content as Array<{ type?: string; image_url?: { url?: string }; text?: string }>) {
            if (part?.image_url?.url) { url = part.image_url.url; break; }
            if (typeof part?.text === "string") {
              const m = part.text.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
              if (m) { url = m[0]; break; }
            }
          }
        }

        if (!url) {
          console.error("[try-on] no image in upstream response:", rawText.slice(0, 2000));
          return Response.json(
            { type: "no_image", title: "No image returned", message: "The AI didn't return a try-on image. This can happen with unusual photos — try a clearer front-facing photo.", recoverable: true, debug: rawText.slice(0, 500) },
            { status: 502 },
          );
        }
        return Response.json({ image: url });
      },
    },
  },
});
