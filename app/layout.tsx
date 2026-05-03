import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mamahjong.online"),
  title: "Mamahjong",
  description: "Boldog Anyák napját! Személyes mahjong solitaire édesanyámnak.",
  openGraph: {
    title: "Mamahjong",
    description: "Boldog Anyák napját, drága Anyukám!",
    url: "https://mamahjong.online",
    siteName: "Mamahjong",
    images: [
      {
        url: "https://mamahjong.online/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mamahjong",
      },
    ],
    locale: "hu_HU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mamahjong",
    description: "Boldog Anyák napját!",
    images: ["https://mamahjong.online/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
