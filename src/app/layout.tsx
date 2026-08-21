import type { Metadata } from "next";
import { Chonburi, IBM_Plex_Sans_Thai, Space_Mono } from "next/font/google";
import "./globals.css";

const chonburi = Chonburi({
  subsets: ["thai", "latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HumSearch — ค้นหาเพลงลูกทุ่งด้วยเสียงร้อง",
  description:
    "ฮัมทำนอง ร้องเพลง หรือพิมพ์เนื้อร้อง เพื่อค้นหาเพลงลูกทุ่งที่ใกล้เคียงที่สุด พร้อมฟังต่อบน YouTube",
  keywords: ["hum to search", "song identifier", "music recognition", "เพลงลูกทุ่ง", "ค้นหาเพลง", "humming search"],
  openGraph: {
    title: "HumSearch — ค้นหาเพลงลูกทุ่งด้วยเสียงร้อง",
    description: "ฮัมทำนอง ร้องเพลง หรือพิมพ์เนื้อร้อง เพื่อค้นหาเพลงลูกทุ่งที่ใกล้เคียงที่สุด",
    type: "website",
  },
};

// ใส่ธีมจาก localStorage ก่อนหน้าเว็บ render เพื่อไม่ให้ธีมกระพริบ (no-flash)
const themeInitScript = `(function(){try{var t=localStorage.getItem('humsearch-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${chonburi.variable} ${plexThai.variable} ${spaceMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
