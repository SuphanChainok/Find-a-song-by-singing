'use client';

import { useState } from 'react';
import { Chonburi, IBM_Plex_Sans_Thai, Space_Mono } from 'next/font/google';
import AudioRecorder from '@/components/audio-recorder';

const chonburi = Chonburi({
  subsets: ['thai', 'latin'],
  weight: '400',
  variable: '--font-display',
});

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

function scoreTone(score: number) {
  if (score >= 80) return { accent: 'var(--marigold)', label: 'text-[var(--marigold)]' };
  if (score >= 50) return { accent: 'var(--neon-pink)', label: 'text-[var(--neon-pink)]' };
  return { accent: 'var(--teal-glow)', label: 'text-[var(--teal-glow)]' };
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchResult = (data: any) => {
    setHasSearched(true);
    if (data.success) {
      setTranscribedText(data.transcribed_text || '');
      setSearchResults(data.results || []);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <main
      className={`${chonburi.variable} ${plexThai.variable} ${spaceMono.variable} hs-search relative min-h-screen overflow-hidden text-[var(--paper)] flex flex-col items-center py-14 px-4`}
      style={{
        background: 'var(--bg-night)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* แสงเรืองพื้นหลัง */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[var(--neon-pink)] opacity-[0.14] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[var(--marigold)] opacity-[0.12] blur-[110px]" />

      {/* แถวไฟประดับด้านบน */}
      <div className="relative z-10 flex gap-3 mb-8" aria-hidden="true">
        {Array.from({ length: 13 }).map((_, i) => (
          <span
            key={i}
            className="bunting-dot block w-2 h-2 rounded-full"
            style={{
              background: i % 3 === 0 ? 'var(--marigold)' : i % 3 === 1 ? 'var(--neon-pink)' : 'var(--teal-glow)',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* หัวเรื่อง */}
        <div className="space-y-3">
          <span
            className="inline-block text-xs tracking-[0.3em] uppercase text-[var(--marigold)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            🎪 ตู้เพลงลูกทุ่งดิจิทัล
          </span>
          <h1
            className="text-4xl sm:text-5xl leading-tight bg-clip-text text-transparent"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundImage: 'linear-gradient(90deg, var(--neon-pink), var(--marigold))',
              textShadow: '0 0 40px rgba(255,45,135,0.25)',
            }}
          >
            Hum &amp; Sing Search
          </h1>
          <p className="text-gray-400">
            ร้องเพลงหรือพูดเนื้อร้องใส่ไมค์ เพื่อค้นหาเพลงลูกทุ่งที่ใกล้เคียงที่สุด
          </p>
        </div>

        {/* เวที + ปุ่มอัดเสียง */}
        <div className="relative flex flex-col items-center py-6">
          <div className="relative flex items-center justify-center">
            <span className="halo-ring absolute w-[340px] h-[340px] rounded-full border border-[var(--neon-pink)]/25" />
            <span className="halo-ring absolute w-[270px] h-[270px] rounded-full border border-[var(--marigold)]/30" style={{ animationDelay: '0.6s' }} />
            <span className="halo-ring absolute w-[200px] h-[200px] rounded-full border border-[var(--teal-glow)]/25" style={{ animationDelay: '1.2s' }} />

            {/* คอมโพเนนต์อัดเสียง */}
            <div className="relative z-10">
              <AudioRecorder onSearchResult={handleSearchResult} />
            </div>
          </div>
          <p
            className="mt-6 text-xs text-gray-500 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            🎤 กดปุ่มไมค์ แล้วฮัมทำนองหรือร้องท่อนที่จำได้
          </p>
        </div>

        {/* แสดงข้อความที่จับเสียงได้ */}
        {transcribedText && (
          <div
            className="text-left rounded-xl p-4 border-l-4"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--teal-glow)' }}
          >
            <span
              className="text-xs font-semibold block uppercase tracking-wider text-[var(--teal-glow)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              เสียงร้องที่คุณร้อง
            </span>
            <p className="text-lg text-gray-100 mt-1 italic">&ldquo;{transcribedText}&rdquo;</p>
          </div>
        )}

        {/* ส่วนแสดงผลลัพธ์เพลงที่ใกล้เคียงที่สุด */}
        {hasSearched && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2
                className="text-xl text-gray-100"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                🎵 เพลงที่ใกล้เคียงที่สุด
              </h2>
              <span
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--marigold)',
                  borderColor: 'rgba(255,176,32,0.3)',
                  background: 'rgba(255,176,32,0.08)',
                }}
              >
                {searchResults.length} เพลง
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-white/15">
                <div className="text-3xl mb-2">📻</div>
                <p className="text-gray-500">
                  ไม่พบเพลงที่ตรงกับเนื้อร้องที่จับได้ ลองร้องใหม่อีกครั้งชัดๆ ครับ
                </p>
              </div>
            ) : (
              searchResults.map((song, index) => {
                const tone = scoreTone(song.score ?? 0);
                const ytUrl =
                  song.youtube_url ||
                  `https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${song.song_name} ${song.artist}`
                  )}`;

                return (
                  <div
                    key={index}
                    className="relative flex gap-4 p-5 rounded-xl border transition-all shadow-lg hover:-translate-y-0.5"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span
                      className="select-none shrink-0 text-3xl leading-none opacity-20"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h3
                            className="text-lg truncate"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-pink)' }}
                          >
                            {song.song_name}
                          </h3>
                          <p className="text-sm text-gray-400">ศิลปิน: {song.artist}</p>
                        </div>

                        <div
                          className="shrink-0 relative w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ background: `conic-gradient(${tone.accent} ${song.score}%, rgba(255,255,255,0.08) 0)` }}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[11px]"
                            style={{ background: 'var(--bg-surface)', fontFamily: 'var(--font-mono)' }}
                          >
                            <span className={tone.label}>{song.score}%</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="pt-3 border-t border-dashed border-white/10 text-xs italic text-gray-300"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        &ldquo;{song.matched_snippet}&rdquo;
                      </div>

                      {/* 🔥 ปุ่ม YouTube โฉมใหม่: แดงนีออน เรืองแสง โดดเด่น สวยงาม */}
                      <div className="pt-3 flex justify-end">
                        <a
                          href={ytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-300 shadow-md hover:shadow-red-600/40 hover:scale-[1.03] active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #FF0000 0%, #D00000 100%)',
                            boxShadow: '0 0 15px rgba(255, 0, 0, 0.35)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {/* ไอคอน YouTube สัญลักษณ์วงกลมสีขาว */}
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#FF0000] text-[10px] font-black group-hover:scale-110 transition-transform">
                            ▶
                          </span>
                          <span className="tracking-wide">ฟังเพลงบน YouTube</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .hs-search {
          --bg-night: #150c24;
          --bg-surface: #221333;
          --neon-pink: #ff2d87;
          --marigold: #ffb020;
          --teal-glow: #2fe6c4;
          --paper: #f7efe0;
        }
        .halo-ring {
          animation: ringPulse 3.2s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(0.96); opacity: 0.35; }
          50% { transform: scale(1.04); opacity: 0.75; }
        }
        .bunting-dot {
          animation: twinkle 2.4s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .halo-ring, .bunting-dot {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}