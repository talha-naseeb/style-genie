import { createFileRoute } from "@tanstack/react-router";

// Lovable AI Gateway image generation via google/gemini-3-flash-image (Nano Banana 2).
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
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body?.userImage || !body?.outfitImage) {
          return new Response("Missing images", { status: 400 });
        }

        const userImage = await toDataUrl(body.userImage);
        const outfitImage = await toDataUrl(body.outfitImage);

        const prompt =
          "You are a fashion AI for a Pakistani ladies boutique. The first image is a person. The second image is a Pakistani outfit (lehenga, shalwar kameez, anarkali, sharara, or similar). Generate a single photorealistic, flattering image of the person from the first image wearing the exact outfit from the second image. Preserve the person's face, skin tone, hair, and body proportions exactly. Keep the outfit's colors, fabric, embroidery, and design accurate. Use clean studio lighting and a soft neutral background. Show as much of the outfit as possible (full body if the original photo allows). Output only the final image.";

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "raw-fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: userImage } },
                  { type: "image_url", image_url: { url: outfitImage } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "AI gateway error", { status: upstream.status });
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
          return new Response(
            JSON.stringify({ error: "No image returned", raw: data }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
        return Response.json({ image: url });
      },
    },
  },
});
