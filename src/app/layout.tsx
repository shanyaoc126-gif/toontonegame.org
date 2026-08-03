import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Free daily color matching challenge: match the target color with HSB, RGB, or CMYK sliders. Scored by CIEDE2000 color difference — the closer your eye, the higher your score.";

export const metadata: Metadata = {
  metadataBase: new URL("https://toontonegame.org"),
  title: "ToonTone Proofing Lab — Daily Color Matching Challenge",
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://toontonegame.org/",
    siteName: "ToonTone Proofing Lab",
    title: "ToonTone Proofing Lab — Daily Color Matching Challenge",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ToonTone Proofing Lab — match the target color with HSB, RGB, or CMYK sliders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToonTone Proofing Lab — Daily Color Matching Challenge",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
