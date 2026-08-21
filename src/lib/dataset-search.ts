import fs from 'fs';
import path from 'path';
import { computeMatchScore } from '@/lib/scoring';

export interface SearchResult {
  song_name: string;
  artist: string;
  matched_snippet: string;
  score: number;
  youtube_url: string; // 👈 1. เพิ่ม Field นี้เข้ามา
}

export function searchSongs(queryText: string): SearchResult[] {
  if (!queryText || !queryText.trim()) return [];

  const csvFilePath = path.join(process.cwd(), 'dataset', 'เนื้อเพลงลูกทุ่ง_1500.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV File not found at:', csvFilePath);
    return [];
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf8');

  const cleanQuery = queryText.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();
  if (cleanQuery.length < 2) return [];

  const blocks = fileContent.split(/\nen,country_lyrics/g);
  const results: SearchResult[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const titleMatch = block.match(/",([^,\n\r]+),\d{4}/);
    const songName = titleMatch ? titleMatch[1].trim() : '';

    const artistMatch = block.match(/,\d{10},1,en,([^,]+),/);
    const artist = artistMatch ? artistMatch[1].trim() : 'ไม่ระบุศิลปิน';

    if (!songName) continue;

    const lyricLines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith('en,country_lyrics') &&
          !l.includes('langcode') &&
          !/^\d+$/.test(l)
      );

    if (lyricLines.length === 0) continue;

    const fullLyrics = lyricLines.join(' ');
    const cleanLyrics = fullLyrics.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();
    const cleanTitle = songName.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();

    // คะแนน 0–100 คำนวณจริงจาก bigram coverage (ดู src/lib/scoring.ts)
    const score = computeMatchScore({
      query: cleanQuery,
      target: cleanLyrics,
      title: cleanTitle,
    });

    if (score >= 25) {
      const snippet = lyricLines.slice(0, 3).join(' ');

      // สร้างลิงก์ YouTube ค้นหาจากชื่อเพลง + ศิลปิน
      const searchQuery = encodeURIComponent(`${songName} ${artist}`);
      const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

      results.push({
        song_name: songName,
        artist: artist,
        matched_snippet: snippet ? `...${snippet}...` : `...${songName}...`,
        score,
        youtube_url: youtubeUrl,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}