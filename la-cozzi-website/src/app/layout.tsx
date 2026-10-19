import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const preferredRegion = 'sin1';

const nunito = localFont({
  src: "./fonts/Nunito-Variable.ttf",
  weight: "200 1000",
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacozzi.com'),
  title: "La Cozzi 拉釦子樂團 | 官方網站",
  description: "La Cozzi 拉釦子樂團，為您的婚禮與重要場合帶來最具感情的手作音樂體驗。",
  openGraph: {
    title: "La Cozzi 拉釦子樂團 | 官方網站",
    description: "La Cozzi 拉釦子樂團，為您的婚禮與重要場合帶來最具感情的手作音樂體驗。",
    url: '/',
    siteName: 'La Cozzi',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "La Cozzi 拉釦子樂團 | 官方網站",
    description: "La Cozzi 拉釦子樂團，為您的婚禮與重要場合帶來最具感情的手作音樂體驗。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`dark scroll-smooth ${nunito.variable}`}>
      <body className={`font-sans bg-stone-950 text-stone-50 selection:bg-amber-500/30 selection:text-amber-100 antialiased min-h-screen overflow-x-hidden relative flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
