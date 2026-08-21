'use client';

import { useState } from 'react';
import {
  AudioLines,
  Disc3,
  ListMusic,
  MonitorPlay,
  Music2,
  Radio,
} from 'lucide-react';
import AudioRecorder from '@/components/audio-recorder';
import type { SongMatch, SongSearchResponse } from '@/types/music';

function scoreTone(score: number) {
  if (score >= 80) return { text: 'text-emerald-400', bar: 'bg-emerald-400', glow: 'from-emerald-500/30 to-teal-600/20' };
  if (score >= 50) return { text: 'text-amber-400', bar: 'bg-amber-400', glow: 'from-amber-500/25 to-orange-600/15' };
  return { text: 'text-zinc-400', bar: 'bg-zinc-500', glow: 'from-zinc-600/20 to-zinc-700/10' };
}

function ArtTile({ size, tone }: { size: 'lg' | 'sm'; tone: ReturnType<typeof scoreTone> }) {
  const dim = size === 'lg' ? 'h-24 w-24 rounded-2xl sm:h-28 sm:w-28' : 'h-12 w-12 rounded-xl';
  const icon = size === 'lg' ? 'h-10 w-10' : 'h-5 w-5';
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br ${tone.glow} ${dim} border border-white/10`}
    >
      <Music2 className={`${icon} text-zinc-300`} strokeWidth={1.5} />
      {size === 'lg' && (
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
      )}
    </div>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <div className="flex w-20 shrink-0 flex-col items-end gap-1.5">
      <span className={`text-sm font-bold ${tone.text}`} style={{ fontFamily: 'var(--font-mono)' }}>
        {score}%
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div className={`score-fill h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(score, 4)}%` }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SongMatch[]>([]);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchResult = (data: SongSearchResponse) => {
    setHasSearched(true);
    if (data.success) {
      setTranscribedText(data.transcribed_text || '');
      setSearchResults(data.results || []);
    } else {
      setSearchResults([]);
    }
  };

  const topResult = searchResults[0];
  const otherResults = searchResults.slice(1);

  return (
    <main
      className="relative flex min-h-dvh flex-col text-zinc-100"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* แสงเรืองพื้นหลัง */}
      <div className="ambient-glow" />

      {/* ── แถบด้านบน ── */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Disc3 className="spin-slow h-6 w-6 text-emerald-400" strokeWidth={1.8} />
            <span
              className="text-lg leading-none text-zinc-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HumSearch
            </span>
          </div>
          <span
            className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-300"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            LUK THUNG FM
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
        {/* ── Hero + ปุ่มอัดเสียง (กึ่งกลางจอตอนยังไม่ค้นหา) ── */}
        <section
          className={`flex w-full flex-col items-center text-center ${
            hasSearched ? 'pt-14 sm:pt-20' : 'flex-1 justify-center py-12'
          }`}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-1.5 text-xs tracking-[0.18em] text-zinc-400"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            ตู้เพลงลูกทุ่งดิจิทัล
          </span>
          <h1
            className="mt-5 text-4xl leading-tight text-zinc-50 sm:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ร้องได้ &hellip;
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-300 bg-clip-text text-transparent">
              เพลงเดียวกัน
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            ฮัมทำนอง ร้องเพลง หรือพิมพ์เนื้อร้องใส่ไมค์
            แล้วให้เราช่วยหาเพลงลูกทุ่งที่คุณกำลังนึกถึง
          </p>
        {/* ── ปุ่มอัดเสียง + ค้นหา ── */}
        <div className="mt-12 flex w-full justify-center">
          <AudioRecorder onSearchResult={handleSearchResult} />
        </div>
        </section>

        {/* ── ผลลัพธ์ ── */}
        {hasSearched && (
          <section className="mt-16 pb-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-xl text-zinc-100" style={{ fontFamily: 'var(--font-display)' }}>
                <ListMusic className="h-5 w-5 text-emerald-400" />
                เพลงที่ใกล้เคียงที่สุด
              </h2>
              {searchResults.length > 0 && (
                <span
                  className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-[11px] text-zinc-400"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {searchResults.length} results
                </span>
              )}
            </div>

            {searchResults.length === 0 ? (
              /* ไม่พบผลลัพธ์ */
              <div className="glass slide-up flex flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center">
                <Disc3 className="h-10 w-10 text-zinc-600" strokeWidth={1.5} />
                <p className="text-sm leading-relaxed text-zinc-400">
                  ไม่พบเพลงที่ตรงกับเนื้อร้องที่จับได้
                  <br />
                  ลองร้องใหม่ให้ชัดขึ้น หรือพิมพ์เนื้อร้องที่จำได้ครับ
                </p>
              </div>
            ) : (
              <>
                {/* อันดับ 1 — การ์ดใหญ่ */}
                {topResult && (() => {
                  const tone = scoreTone(topResult.score);
                  const ytUrl =
                    topResult.youtube_url ||
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `${topResult.song_name} ${topResult.artist}`
                    )}`;
                  return (
                    <article className="glass slide-up relative overflow-hidden rounded-3xl p-5 sm:p-7">
                      <div
                        className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${tone.glow} blur-3xl`}
                      />
                      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <ArtTile size="lg" tone={tone} />

                        <div className="min-w-0 flex-1 space-y-2">
                          <span
                            className="inline-block rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            Top match
                          </span>
                          <h3
                            className="truncate text-2xl leading-snug text-zinc-50 sm:text-3xl"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {topResult.song_name}
                          </h3>
                          <p className="truncate text-sm text-zinc-400">{topResult.artist}</p>
                          <p
                            className="truncate pt-1 text-xs italic text-zinc-500"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            &ldquo;{topResult.matched_snippet}&rdquo;
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:justify-center">
                          <ScoreMeter score={topResult.score} />
                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 rounded-full bg-red-600 py-2.5 pl-4 pr-5 text-xs font-semibold text-white shadow-lg shadow-red-950/40 transition-all hover:bg-red-500 hover:shadow-red-900/40 active:scale-95"
                          >
                            <MonitorPlay className="h-4 w-4 transition-transform group-hover:scale-110" />
                            ฟังบน YouTube
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })()}

                {/* อันดับถัดไป — แถวย่อ */}
                {otherResults.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {otherResults.map((song, i) => {
                      const tone = scoreTone(song.score);
                      const ytUrl =
                        song.youtube_url ||
                        `https://www.youtube.com/results?search_query=${encodeURIComponent(
                          `${song.song_name} ${song.artist}`
                        )}`;
                      return (
                        <li
                          key={i}
                          className={`slide-up group flex items-center gap-4 rounded-2xl border border-white/6 bg-white/[0.03] p-3.5 transition-colors hover:border-white/12 hover:bg-white/[0.055] stagger-${Math.min(i + 1, 5)}`}
                        >
                          <span
                            className="w-6 shrink-0 text-center text-sm text-zinc-600"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {i + 2}
                          </span>

                          <ArtTile size="sm" tone={tone} />

                          <div className="min-w-0 flex-1">
                            <a
                              href={ytUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-[15px] font-medium text-zinc-100 transition-colors group-hover:text-emerald-300"
                            >
                              {song.song_name}
                            </a>
                            <p className="truncate text-xs text-zinc-500">{song.artist}</p>
                            <p
                              className="mt-0.5 hidden truncate text-[11px] italic text-zinc-600 sm:block"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              &ldquo;{song.matched_snippet}&rdquo;
                            </p>
                          </div>

                          <ScoreMeter score={song.score} />

                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`ฟัง ${song.song_name} บน YouTube`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-all hover:border-red-500/60 hover:bg-red-500/15 hover:text-red-400 active:scale-90"
                          >
                            <MonitorPlay className="h-4 w-4" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* เสียงร้องที่จับได้ */}
                {transcribedText && (
                  <div className="slide-up mt-8 flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-5 py-4">
                    <AudioLines className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        เสียงร้องที่จับได้
                      </p>
                      <p className="mt-1 break-words text-sm italic leading-relaxed text-zinc-300">
                        &ldquo;{transcribedText}&rdquo;
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 py-8 text-center">
        <p className="text-xs text-zinc-600" style={{ fontFamily: 'var(--font-mono)' }}>
          HumSearch · ค้นหาเพลงลูกทุ่งด้วยเสียงของคุณ
        </p>
      </footer>
    </main>
  );
}
