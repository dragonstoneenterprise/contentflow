import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snipflow — AI Content Repurposing & Idea Extractor",
  description:
    "Paste any transcript and get a blog post, Twitter thread, YouTube Shorts script, or a prioritized action plan — instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
