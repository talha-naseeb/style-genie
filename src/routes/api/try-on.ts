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
          "VIRTUAL TRY-ON TASK for a Pakistani ladies boutique.\n\n" +
          "INPUT 1 (PERSON): The first image shows the customer. This is the IDENTITY reference — you MUST preserve it exactly.\n" +
          "INPUT 2 (OUTFIT): The second image shows a Pakistani outfit (lehenga, shalwar kameez, anarkali, sharara, gharara, saree, or kurta set). This is the GARMENT reference — you MUST reproduce it exactly.\n\n" +
          "STRICT RULES — DO NOT DEVIATE:\n" +
          "1. FACE: Copy the customer's face pixel-accurately. Same facial features, same eyes, nose, lips, jawline, eyebrows, skin tone, makeup, and hair (style, length, color, parting). Do NOT beautify, slim, lighten, or alter the face in any way. It must look like the SAME person.\n" +
          "2. BODY: Keep the same body type, height proportions, and posture as the customer's photo. Do not change body shape.\n" +
          "3. OUTFIT: Reproduce the outfit from image 2 with 100% fidelity — exact same colors, fabric texture, embroidery patterns, motifs, dupatta, neckline, sleeve length, hemline, and silhouette. Do NOT invent new patterns or change colors.\n" +
          "4. FIT: Drape the outfit naturally on the customer's body with correct folds, shadows, and physics.\n" +
          "5. FRAMING: Full-body or three-quarter portrait so the entire outfit is visible. Clean studio lighting, soft neutral background (light beige or off-white).\n" +
          "6. QUALITY: Photorealistic, sharp, high resolution, no artifacts, no extra limbs, no warped hands.\n\n" +
          "OUTPUT: Return ONLY the final composite image. No text, no variations, no collage.";


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
                    { type: "text", text: "IMAGE 1 — THE CUSTOMER (identity reference). Preserve face, hair, skin tone, and body exactly:" },
                    { type: "image_url", image_url: { url: userImage } },
                    { type: "text", text: "IMAGE 2 — THE OUTFIT (garment reference). This is the EXACT outfit the customer must wear. Reproduce every detail: same colors, same fabric, same embroidery/print, same neckline, same sleeves, same dupatta, same silhouette. Do NOT substitute, recolor, simplify, or invent a different outfit. The garment in your output must be visually identical to this image:" },
                    { type: "image_url", image_url: { url: outfitImage } },
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

        const data = (await upstream.json()) as {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
              content?: string;
            };
          }>;
        };

        const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!url) {
          return Response.json(
            { type: "no_image", title: "No image returned", message: "The AI didn't return a try-on image. This can happen with unusual photos — try a clearer front-facing photo.", recoverable: true },
            { status: 502 },
          );
        }
        return Response.json({ image: url });
      },
    },
  },
});
