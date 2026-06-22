import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, Wand2, Share2 } from "lucide-react";
import bridal from "@/assets/outfits/bridal-1.jpg";
import party from "@/assets/outfits/party-2.jpg";
import formal from "@/assets/outfits/formal-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maryam & Maria — See yourself in our collection" },
      {
        name: "description",
        content:
          "AI-powered virtual try-on by Maryam & Maria. Upload your photo, pick an outfit, and see yourself styled in seconds.",
      },
      { property: "og:title", content: "Maryam & Maria — Virtual Try-On Boutique" },
      {
        property: "og:description",
        content: "Try on bridal, formal, party and casual Pakistani wear — virtually.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-2xl tracking-wide text-foreground">
          Noor<span className="text-primary">.</span>
        </Link>
        <Link
          to="/try-on"
          className="rounded-full border border-primary/40 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Try-On
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-16">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered virtual try-on
          </span>
          <h1 className="font-display text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
            See yourself in <em className="text-primary not-italic">our collection</em>.
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            Upload a photo, browse our Pakistani bridal, formal, party and casual wear, and watch yourself
            styled in your favourite outfit — instantly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/try-on"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              Start Try-On
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm text-foreground hover:border-primary/60"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            {[bridal, party, formal].map((src, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-muted shadow-soft"
                style={{ transform: `translateY(${i % 2 === 0 ? "1.5rem" : "-1.5rem"})` }}
              >
                <img
                  src={src}
                  alt="Boutique outfit"
                  width={768}
                  height={1024}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
          {[
            { icon: Camera, title: "Upload your photo", text: "Front-facing, well-lit, waist-up or full body." },
            { icon: Wand2, title: "Pick an outfit", text: "Browse bridal, formal, party and casual styles." },
            { icon: Share2, title: "Generate & share", text: "Download your look or share on WhatsApp." },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© Noor Boutique — Virtual Try-On Demo</span>
          <span>Made with ✨ AI</span>
        </div>
      </footer>
    </main>
  );
}
