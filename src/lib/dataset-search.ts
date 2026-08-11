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

  // ลบอักขระพิเศษและช่องว่าง ให้เหลือเฉพาะพยัญชนะ/สระ
  const cleanQuery = queryText.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();

  // แยกไฟล์ CSV ตามบล็อกเพลง
  const blocks = fileContent.split(/\nen,country_lyrics/g);
  const results: SearchResult[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    // 1. ดึงชื่อเพลง
    const titleMatch = block.match(/",([^,\n\r]+),\d{4}/);
    const songName = titleMatch ? titleMatch[1].trim() : '';

    // 2. ดึงชื่อศิลปิน
    const artistMatch = block.match(/,\d{10},1,en,([^,]+),/);
    const artist = artistMatch ? artistMatch[1].trim() : 'ไม่ระบุศิลปิน';

    if (!songName) continue;

    const cleanBlockText = block.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();

    // 3. คำนวณความเหมือนแบบ Fuzzy Matching (ซอยเป็นชิ้นละ 2 ตัวอักษร)
    const chunkSize = 2;
    let matchCount = 0;
    const totalChunks = Math.max(1, cleanQuery.length - chunkSize + 1);

    for (let i = 0; i <= cleanQuery.length - chunkSize; i++) {
      const chunk = cleanQuery.substring(i, i + chunkSize);
      if (cleanBlockText.includes(chunk)) {
        matchCount++;
      }
    }

    const similarityRatio = matchCount / totalChunks;

    // ถ้าเหมือนกันเกิน 35% ถือว่าเข้าข่าย
    if (similarityRatio > 0.35) {
      const score = Math.min(99, Math.round(similarityRatio * 100));

      // ดึงตัวอย่างเนื้อเพลงในบล็อกนั้นมาแสดง
      const lines = block
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('en,country_lyrics') && !l.includes('langcode'));

      const snippet = lines.slice(0, 3).join(' ');

      results.push({
        song_name: songName,
        artist: artist,
        matched_snippet: snippet ? `...${snippet}...` : '...' + songName + '...',
        score: score,
      });
    }
  }

  // เรียงลำดับจาก score สูงไปต่ำ แล้วตัดเอา Top 5
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}