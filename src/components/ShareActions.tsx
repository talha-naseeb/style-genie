import { Button } from "@/components/ui/button";
import { Download, Share2, MessageCircle } from "lucide-react";

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type });
}

export function ShareActions({ imageUrl }: { imageUrl: string }) {
  async function onShare() {
    try {
      const file = await dataUrlToFile(imageUrl, "my-try-on.png");
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: "My Virtual Try-On",
          text: "Look how I'd look in this outfit! 💃",
        });
      } else {
        alert("Sharing not supported on this device — try Download or WhatsApp.");
      }
    } catch {
      /* user canceled */
    }
  }

  const whatsappHref =
    "https://wa.me/?text=" + encodeURIComponent("Look how I'd look in this outfit! 💃 (Image attached below)");

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button asChild>
        <a href={imageUrl} download="try-on.png">
          <Download className="mr-1 h-4 w-4" />
          Download
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-1 h-4 w-4" />
          WhatsApp
        </a>
      </Button>
      <Button variant="outline" onClick={onShare}>
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
