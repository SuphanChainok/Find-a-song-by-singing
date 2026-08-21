"use client";

/**
 * song-result-card.tsx
 * Displays a single song match result with score, album art, artist, and links
 */

import { useState, useRef } from "react";
import Image from "next/image";
import { Music, ExternalLink, Play, Pause, Headphones, MonitorPlay } from "lucide-react";
import { SongResult } from "@/types/music";
import { cn } from "@/lib/utils";

interface SongResultCardProps {
  song: SongResult;
  rank: number;
  isTopResult?: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "from-emerald-400 to-teal-500"
      : score >= 75
      ? "from-violet-400 to-fuchsia-500"
      : score >= 60
      ? "from-amber-400 to-orange-500"
      : "from-slate-400 to-slate-500";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-14 h-14 rounded-2xl",
        "bg-gradient-to-br text-white font-bold shadow-lg shrink-0",
        color
      )}
      title={`Match confidence: ${score}%`}
    >
      <span className="text-lg leading-none">{score}</span>
      <span className="text-[10px] leading-none opacity-80">%</span>
    </div>
  );
}

function AlbumArt({ src, title }: { src?: string; title: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0">
        <Music className="w-7 h-7 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
      <Image
        src={src}
        alt={`${title} album art`}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
        sizes="64px"
        unoptimized
      />
    </div>
  );
}

export default function SongResultCard({ song, rank, isTopResult }: SongResultCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = () => {
    if (!song.previewUrl) return;
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audioEl = audioRef.current;

    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
    } else {
      audioEl.src = song.previewUrl;
      audioEl.play().catch(console.error);
      setIsPlaying(true);
      audioEl.onended = () => setIsPlaying(false);
    }
  };

  const releaseInfo = [
    song.releaseYear,
    song.genre?.slice(0, 2).join(" · "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
        "hover:translate-y-[-2px] hover:shadow-xl",
        isTopResult
          ? "bg-gradient-to-r from-violet-900/50 to-fuchsia-900/30 border-violet-500/40 shadow-violet-900/30"
          : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600/80"
      )}
    >
      {/* Rank number */}
      <span
        className={cn(
          "absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
          isTopResult
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg"
            : "bg-slate-700 text-slate-400"
        )}
      >
        {rank}
      </span>

      {/* Album Art */}
      <AlbumArt src={song.albumArt} title={song.song_name} />

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-semibold text-base truncate",
            isTopResult ? "text-white" : "text-slate-100"
          )}
        >
          {song.song_name}
        </h3>
        <p className="text-slate-400 text-sm truncate">{song.artist}</p>
        {song.album && (
          <p className="text-slate-500 text-xs truncate">{song.album}</p>
        )}
        {releaseInfo && (
          <p className="text-slate-600 text-xs mt-0.5">{releaseInfo}</p>
        )}
        {song.matched_lyric_snippet && (
          <p className="text-violet-300/80 text-xs mt-2 italic line-clamp-2 leading-relaxed">
            &ldquo;{song.matched_lyric_snippet}&rdquo;
          </p>
        )}
      </div>

      {/* Score Badge */}
      <ScoreBadge score={song.score} />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 items-center">
        {/* Preview Play/Pause */}
        {song.previewUrl && (
          <button
            id={`preview-btn-${song.id}`}
            onClick={togglePreview}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-slate-700 hover:bg-violet-600 text-slate-300 hover:text-white"
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        {/* Spotify link */}
        {song.spotifyUrl && (
          <a
            id={`spotify-link-${song.id}`}
            href={song.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on Spotify"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all"
          >
            <Headphones className="w-4 h-4" />
          </a>
        )}

        {/* YouTube link */}
        {song.youtubeUrl && (
          <a
            id={`youtube-link-${song.id}`}
            href={song.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch on YouTube"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition-all"
          >
            <MonitorPlay className="w-4 h-4" />
          </a>
        )}

        {/* Generic external link fallback */}
        {!song.spotifyUrl && !song.youtubeUrl && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700/50 text-slate-600">
            <ExternalLink className="w-4 h-4" />
          </div>
        )}
      </div>
    </article>
  );
}
