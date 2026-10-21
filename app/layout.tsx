import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Roboto, Schibsted_Grotesk } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site";
import "./globals.css";

// Site chrome uses a grotesk close in spirit to Tidepool's web type, without
// rehosting their licensed font. Roboto is the Android frame's system face.
const site = Schibsted_Grotesk({ variable: "--font-site", subsets: ["latin"], display: "optional" });
const roboto = Roboto({ variable: "--font-roboto-face", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Held to the iOS bar: an Android parity concept", template: "%s · Held to the iOS bar" },
  description:
    "An unofficial concept by Hafsa Usmani: two critical tasks of an automated insulin dosing app, designed for Android and checked against the iOS reference. Not a medical device. Mock data.",
  // A concept for a few readers. Keep it out of search so no one looking for
  // diabetes help lands on a mock insulin app.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6f7fb", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${site.variable} ${roboto.variable} antialiased`}>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
