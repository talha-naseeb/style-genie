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

export type TryOnErrorType =
  | "rate_limit"
  | "credits_exhausted"
  | "bad_request"
  | "no_image"
  | "network"
  | "gateway_error"
  | "config_error"
  | "unknown";

export interface TryOnError {
  type: TryOnErrorType;
  title: string;
  message: string;
  recoverable: boolean;
}

export class TryOnErrorException extends Error {
  constructor(public detail: TryOnError: { detail: TryOnError }) {
    super(detail.message);
    this.name = "TryOnErrorException";
  }
}

function categorizeError(status: number, body: unknown): TryOnError {
  if (typeof body === "object" && body !== null && "type" in body) {
    const b = body as Record<string, unknown>;
    return {
      type: (b.type as TryOnErrorType) || "unknown",
      title: (fromApi: typeof b.title === "string" ? b.title : "Something went wrong",
      message: typeof b.message === "string" ? b.message : "An unexpected error occurred. Please try again.",
      recoverable: b.recoverable !== false,
    };
  }

  if (status === 429) {
    return {
      type: "rate_limit",
      title: "Too busy",
      message: "Our AI stylist is in high demand right now. Please wait a moment and try again.",
      recoverable: true,
    };
  }
  if (status === 402) {
    return {
      type: "credits_exhausted",
      title: "Credits exhausted",
      message: "AI generation credits have run out. Please add credits to your workspace to continue.",
      recoverable: false,
    };
  }
  if (status === 400) {
    return {
      type: "bad_request",
      title: "Invalid request",
      message: "We couldn't process your photo or outfit. Try a different image and make sure it's a clear photo of you.",
      recoverable: true,
    };
  }
  if (status >= 500) {
    return {
      type: "gateway_error",
      title: "AI service error",
      message: "The AI service is temporarily unavailable. Please try again in a moment.",
      recoverable: true,
    };
  }
  return {
    type: "unknown",
    title: "Unexpected error",
    message: `Try-on failed (status ${status}). Please try again.`,
    recoverable: true,
  };
}

export async function generateTryOn(req: TryOnRequest): Promise<TryOnResponse> {
  let res: Response;
  try {
    res = await fetch("/api/try-on", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new TryOnErrorException({
      type: "network",
      title: "Connection failed",
      message: "We couldn't reach the server. Check your internet connection and try again.",
      recoverable: true,
    });
  }

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* no-op */ }
    throw new TryOnErrorException(categorizeError(res.status, body));
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new TryOnErrorException({
      type: "unknown",
      title: "Bad response",
      message: "The server returned an unreadable response. Please try again.",
      recoverable: true,
    });
  }
  return data as TryOnResponse;
}
