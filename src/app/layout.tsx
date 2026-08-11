import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HumSearch — Find Songs by Humming",
  description:
    "Hum or sing any melody to instantly identify the song. Powered by audio recognition technology.",
  keywords: ["hum to search", "song identifier", "music recognition", "singing search", "find song by humming"],
  openGraph: {
    title: "HumSearch — Find Songs by Humming",
    description: "Hum or sing any melody to instantly identify the song.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
