import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentFlow — Transform Any Transcript Into 3 Content Formats",
  description: "Paste any video transcript and get a publish-ready blog post, Twitter thread, and YouTube Shorts script in under 2 minutes. Free to try.",
  openGraph: {
    title: "ContentFlow — One Transcript. Three Formats. Two Minutes.",
    description: "AI-powered content repurposing. Paste a transcript, get a blog post, Twitter thread, and Shorts script instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentFlow — One Transcript. Three Formats. Two Minutes.",
    description: "AI-powered content repurposing. Paste a transcript, get a blog post, Twitter thread, and Shorts script instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
