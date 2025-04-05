import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import NewPostButton from "../components/NewPostButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmotionSNS - 感情分析SNS",
  description: "感情分析を活用したソーシャルネットワーキングサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 dark:bg-gray-950`}
      >
        <Header />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
        <NewPostButton />
      </body>
    </html>
  );
}
