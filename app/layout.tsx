import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptGuard — Enterprise Prompt Injection Detection",
  description:
    "Stop prompt injection before it reaches your model. Sub-5ms detection at enterprise scale with zero added latency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fontshare CDN — Ranade + Switzer as specified */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=ranade@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-ink antialiased">{children}</body>
    </html>
  );
}
