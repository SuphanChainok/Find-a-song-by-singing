import fs from 'fs';
import path from 'path';

export interface SearchResult {
  song_name: string;
  artist: string;
  matched_snippet: string;
  score: number;
}

export function searchSongs(queryText: string): SearchResult[] {
  if (!queryText || !queryText.trim()) return [];

  const csvFilePath = path.join(process.cwd(), 'dataset', 'เนื้อเพลงลูกทุ่ง_1500.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV File not found at:', csvFilePath);
    return [];
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf8');

  // 1. ทำความสะอาดข้อความค้นหา
  const cleanQuery = queryText.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();
  if (cleanQuery.length < 2) return [];

  // แยกข้อความที่ User ร้อง ออกเป็นชิ้นสั้นๆ ชิ้นละ 2 ตัวอักษร (Bi-grams)
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

    // ดึงชื่อเพลง
    const titleMatch = block.match(/",([^,\n\r]+),\d{4}/);
    const songName = titleMatch ? titleMatch[1].trim() : '';

    // ดึงชื่อศิลปิน
    const artistMatch = block.match(/,\d{10},1,en,([^,]+),/);
    const artist = artistMatch ? artistMatch[1].trim() : 'ไม่ระบุศิลปิน';

    if (!songName) continue;

    // ดึงเฉพาะเนื้อเพลงจริง
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

    // 2. คำนวณว่าชิ้นส่วนคำที่ User ร้อง โผล่ในเนื้อเพลงนี้คิดเป็นกี่ %
    let matchCount = 0;
    for (const chunk of queryChunks) {
      if (cleanLyrics.includes(chunk) || cleanTitle.includes(chunk)) {
        matchCount++;
      }
    }

    let score = Math.round((matchCount / totalChunks) * 100);

    // ถ้ามีประโยคตรงกันเต็มๆ ให้คะแนน 100%
    if (cleanLyrics.includes(cleanQuery) || cleanTitle.includes(cleanQuery)) {
      score = 100;
    }

    // 3. กรองเฉพาะเพลงที่ตรงเกิน 25% ขึ้นไป (รองรับคำเพี้ยนได้สบายๆ)
    if (score >= 25) {
      const snippet = lyricLines.slice(0, 3).join(' ');

      results.push({
        song_name: songName,
        artist: artist,
        matched_snippet: snippet ? `...${snippet}...` : `...${songName}...`,
        score: score,
      });
    }
  }

  // 4. เรียงจากคะแนนมากไปน้อย แล้วเอาเฉพาะ Top 5
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}