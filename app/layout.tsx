import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Caveat,
  Patrick_Hand,
  Fredoka,
  Nunito,
  Fraunces,
  Lora,
  Special_Elite,
  Courier_Prime,
} from "next/font/google";
import "./globals.css";
import { DEFAULT_APPEARANCE } from "@/lib/appearance";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Extra fonts for the font choices in Settings. They load only when a choice uses them.
// (next/font needs its options written out literally, so they are repeated here.)
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "700"], preload: false });
const patrick = Patrick_Hand({ variable: "--font-patrick", subsets: ["latin"], weight: "400", preload: false });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], preload: false });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], preload: false });
const elite = Special_Elite({ variable: "--font-elite", subsets: ["latin"], weight: "400", preload: false });
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"], preload: false });

export const metadata: Metadata = {
  title: "Don't Forget…!",
  description: "A hub for the things you would normally forget.",
};

const fontClasses = [geistSans, geistMono, caveat, patrick, fredoka, nunito, fraunces, lora, elite, courier].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={fontClasses}
      data-theme={DEFAULT_APPEARANCE.theme}
      data-font={DEFAULT_APPEARANCE.font}
      data-layout={DEFAULT_APPEARANCE.layout}
    >
      <body>{children}</body>
    </html>
  );
}
