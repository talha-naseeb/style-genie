import bridal1 from "@/assets/outfits/bridal-1.jpg";
import bridal2 from "@/assets/outfits/bridal-2.jpg";
import bridal3 from "@/assets/outfits/bridal-3.jpg";
import formal1 from "@/assets/outfits/formal-1.jpg";
import formal2 from "@/assets/outfits/formal-2.jpg";
import formal3 from "@/assets/outfits/formal-3.jpg";
import party1 from "@/assets/outfits/party-1.jpg";
import party2 from "@/assets/outfits/party-2.jpg";
import party3 from "@/assets/outfits/party-3.jpg";
import casual1 from "@/assets/outfits/casual-1.jpg";
import casual2 from "@/assets/outfits/casual-2.jpg";
import casual3 from "@/assets/outfits/casual-3.jpg";

export type Category = "Bridal" | "Formal" | "Party" | "Casual";

export interface Outfit {
  id: string;
  name: string;
  category: Category;
  image: string;
}

export const CATEGORIES: Category[] = ["Bridal", "Formal", "Party", "Casual"];

export const OUTFITS: Outfit[] = [
  { id: "bridal-1", name: "Maroon Zardozi Lehenga", category: "Bridal", image: bridal1 },
  { id: "bridal-2", name: "Ivory Gold Bridal Gown", category: "Bridal", image: bridal2 },
  { id: "bridal-3", name: "Blush Walima Gown", category: "Bridal", image: bridal3 },
  { id: "formal-1", name: "Teal Lawn 3-Piece", category: "Formal", image: formal1 },
  { id: "formal-2", name: "Powder Blue Chikan Suit", category: "Formal", image: formal2 },
  { id: "formal-3", name: "Emerald Chiffon Suit", category: "Formal", image: formal3 },
  { id: "party-1", name: "Royal Purple Sharara", category: "Party", image: party1 },
  { id: "party-2", name: "Black & Gold Anarkali", category: "Party", image: party2 },
  { id: "party-3", name: "Dusty Rose Peplum Set", category: "Party", image: party3 },
  { id: "casual-1", name: "White Kurta & Denim", category: "Casual", image: casual1 },
  { id: "casual-2", name: "Mustard Lawn Kurti", category: "Casual", image: casual2 },
  { id: "casual-3", name: "Sage Embroidered Tunic", category: "Casual", image: casual3 },
];
