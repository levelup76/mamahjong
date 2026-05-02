import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mamahjong",
  description: "Anyák napi mahjong solitaire",
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
