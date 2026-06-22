import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  ImageOff,
  CreditCard,
  RotateCcw,
  Camera,
} from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SmartCrop } from "@/components/SmartCrop";
import { OutfitGrid } from "@/components/OutfitGrid";
import { CompareSlider } from "@/components/CompareSlider";
import { ShareActions } from "@/components/ShareActions";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { generateTryOn, TryOnErrorException } from "@/lib/tryOnService";
import type { TryOnError } from "@/lib/tryOnService";
import type { Outfit } from "@/lib/outfits";

export const Route = createFileRoute("/try-on")({
  head: () => ({
    meta: [
      { title: "Try-On — Noor Boutique" },
      { name: "description", content: "Upload your photo and try on Pakistani outfits virtually." },
    ],
  }),
  component: TryOnWizard,
});

type Step = 0 | 1 | 2 | 3;

function TryOnWizard() {
  const [step, setStep] = useState<Step>(0);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TryOnError | null>(null);

  async function generate() {
    if (!croppedPhoto || !outfit) return;
    setLoading(true);
    setError(null);
    try {
      const { image } = await generateTryOn({
        userImage: croppedPhoto,
        outfitImage: new URL(outfit.image, window.location.origin).toString(),
      });
      setResult(image);
      setStep(3);
    } catch (e) {
      if (e instanceof TryOnErrorException) {
        setError(e.detail);
      } else {
        setError({
          type: "unknown",
          title: "Unexpected error",
          message: e instanceof Error ? e.message : "Something went wrong.",
          recoverable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRawPhoto(null);
    setCroppedPhoto(null);
    setOutfit(null);
    setResult(null);
    setError(null);
    setStep(0);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <span className="font-display text-xl">Noor<span className="text-primary">.</span></span>
        <span className="w-16" />
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <StepIndicator current={step} />

        {error && (
          <div className="mx-auto mb-4 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 0: Upload */}
        {step === 0 && (
          <PhotoUpload
            onPhoto={(d) => {
              setRawPhoto(d);
              setStep(1);
            }}
          />
        )}

        {/* Step 1: Smart crop */}
        {step === 1 && rawPhoto && (
          <SmartCrop
            src={rawPhoto}
            onBack={() => setStep(0)}
            onConfirm={(d) => {
              setCroppedPhoto(d);
              setStep(2);
            }}
          />
        )}

        {/* Step 2: Outfit */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              {croppedPhoto && (
                <img
                  src={croppedPhoto}
                  alt="You"
                  className="h-32 w-24 rounded-xl border border-primary/30 object-cover shadow-soft"
                />
              )}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-2xl">Choose an outfit</h2>
                <p className="text-sm text-muted-foreground">
                  Pick any look from our Pakistani collection — tap to select.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Re-crop
              </Button>
            </div>

            <OutfitGrid selected={outfit} onSelect={setOutfit} />

            <div className="sticky bottom-4 z-10 flex justify-center">
              <Button
                size="lg"
                disabled={!outfit || loading}
                onClick={generate}
                className="rounded-full px-8 shadow-soft"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Styling you up…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate My Look
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Loading overlay between step 2 and 3 */}
        {loading && step === 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-soft">
              <div className="relative">
                <Sparkles className="h-10 w-10 animate-pulse text-primary" />
              </div>
              <p className="font-display text-xl">Styling you up… ✨</p>
              <p className="text-sm text-muted-foreground">This usually takes 10–20 seconds.</p>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && croppedPhoto && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-3xl">Your new look ✨</h2>
              <p className="text-sm text-muted-foreground">
                Drag the slider to compare. Save it or share with friends.
              </p>
            </div>

            <CompareSlider before={croppedPhoto} after={result} />

            <ShareActions imageUrl={result} />

            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Try another outfit
              </Button>
              <Button variant="ghost" onClick={reset}>
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
