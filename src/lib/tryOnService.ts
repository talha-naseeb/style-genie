// Client-side caller for the Virtual Try-On AI.
// Current backend: Lovable AI Gateway (Google Gemini image model) via /api/try-on.
// TODO: Replace with Replicate IDM-VTON API for production.

export interface TryOnRequest {
  userImage: string; // data URL
  outfitImage: string; // data URL or absolute URL
}

export interface TryOnResponse {
  image: string; // data URL of generated try-on
}

export async function generateTryOn(req: TryOnRequest): Promise<TryOnResponse> {
  const res = await fetch("/api/try-on", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("We're a little busy — please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up your workspace credits.");
    throw new Error(txt || `Try-on failed (${res.status})`);
  }
  return (await res.json()) as TryOnResponse;
}
