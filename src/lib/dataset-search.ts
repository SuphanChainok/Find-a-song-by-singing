import fs from 'fs';
import path from 'path';

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

  const queryChunks: string[] = [];
  const chunkSize = 2;
  for (let i = 0; i <= cleanQuery.length - chunkSize; i++) {
    queryChunks.push(cleanQuery.substring(i, i + chunkSize));
  }
  const totalChunks = Math.max(1, queryChunks.length);

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

    let matchCount = 0;
    for (const chunk of queryChunks) {
      if (cleanLyrics.includes(chunk) || cleanTitle.includes(chunk)) {
        matchCount++;
      }
    }

    let score = Math.round((matchCount / totalChunks) * 100);

    if (cleanLyrics.includes(cleanQuery) || cleanTitle.includes(cleanQuery)) {
      score = 100;
    }

    if (score >= 25) {
      const snippet = lyricLines.slice(0, 3).join(' ');

      // 👈 2. สร้างลิงก์ YouTube ค้นหาเพลง + ศิลปิน
      const searchQuery = encodeURIComponent(`${songName} ${artist}`);
      const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

      results.push({
        song_name: songName,
        artist: artist,
        matched_snippet: snippet ? `...${snippet}...` : `...${songName}...`,
        score: score,
        youtube_url: youtubeUrl, // 👈 3. ส่ง URL กลับไป
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}