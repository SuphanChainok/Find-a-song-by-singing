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

  // 1. ทำความสะอาดข้อความที่ร้องมา (ลบเว้นวรรค เครื่องหมายสัญลักษณ์ และแปลงเป็นตัวพิมพ์เล็ก)
  const cleanQuery = queryText.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();

  // ถ้าคำร้องสั้นเกินไป (น้อยกว่า 2 ตัวอักษร) ไม่ต้องค้นหา
  if (cleanQuery.length < 2) return [];

  // แยกไฟล์ CSV ออกเป็นบล็อกของแต่ละเพลง
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

    // ทำความสะอาดเนื้อเพลงในบล็อก
    const cleanBlockText = block.replace(/[\s\n\r\t.,!?'"-]+/g, '').toLowerCase();

    let score = 0;
    const exactMatchIndex = cleanBlockText.indexOf(cleanQuery);

    // 2. คำนวณคะแนนความเหมือน (Matching Score)
    if (exactMatchIndex !== -1) {
      // กรณีตรงกันทั้งท่อนแบบเป๊ะๆ
      score = 100;
    } else {
      // กรณีออกเสียงเพี้ยนหรือตรงบางคำ (คำนวณผ่าน N-Gram 2 ตัวอักษร)
      const chunkSize = 2;
      let matchCount = 0;
      const totalChunks = Math.max(1, cleanQuery.length - chunkSize + 1);

      for (let i = 0; i <= cleanQuery.length - chunkSize; i++) {
        const chunk = cleanQuery.substring(i, i + chunkSize);
        if (cleanBlockText.includes(chunk)) {
          matchCount++;
        }
      }

      const ratio = matchCount / totalChunks;

      // แปลงอัตราส่วนความเหมือนเป็นคะแนน 0-99%
      score = Math.round(ratio * 100);
    }

    // 3. กรองเฉพาะเพลงที่มีความเหมือนเกิน 50% เท่านั้น (อันที่ไม่เหมือนจะไม่ถูกเก็บเข้ามา)
    if (score >= 50) {
      // ดึงท่อนเนื้อเพลงตัวอย่าง
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) => l && !l.startsWith('en,country_lyrics') && !l.includes('langcode')
        );

      const snippet = lines.slice(0, 3).join(' ');

      results.push({
        song_name: songName,
        artist: artist,
        matched_snippet: snippet ? `...${snippet}...` : `...${songName}...`,
        score: score,
      });
    }
  }

  // 4. เรียงลำดับจากเพลงที่ Score สูงสุด (เหมือนที่สุด) ไปหาน้อยสุด
  return results.sort((a, b) => b.score - a.score);
}