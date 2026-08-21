/**
 * scoring.ts — สูตรคำนวณความคล้ายคลึงระหว่างข้อความค้นหากับเนื้อร้อง (0–100)
 *
 * หลักการ:
 * 1) แปลงข้อความเป็น bigram (คู่อักษรติดกัน) แบบไม่ซ้ำ
 * 2) coverage = จำนวน bigram ของ query ที่พบในเนื้อร้อง/ชื่อเพลง ÷ bigram ทั้งหมด
 * 3) ถ้าเจอ query ทั้งก้อนในเนื้อร้องหรือชื่อเพลง → 100 (exact match)
 * 4) ค่าผลลัพธ์ clamp ไว้ในช่วง 0–100 เสมอ
 */

function normalize(text: string): string {
  return text
    .replace(/[\s\n\r\t.,!?'"()\-]+/g, '')
    .toLowerCase();
}

export interface MatchScoreInput {
  /** ข้อความที่ผู้ใช้ค้นหา (raw หรือ normalize แล้วก็ได้) */
  query: string;
  /** เนื้อร้องเป้าหมาย */
  target: string;
  /** ชื่อเพลง (ใช้ร่วมค้นด้วย ถ้ามี) */
  title?: string;
}

export function computeMatchScore({ query, target, title = '' }: MatchScoreInput): number {
  const q = normalize(query);
  const t = normalize(target);
  const ti = normalize(title);

  if (q.length < 2 || (!t && !ti)) return 0;

  // exact match: เจอข้อความทั้งก้อนในชื่อเพลงหรือเนื้อร้อง
  if ((ti.length > 0 && ti.includes(q)) || t.includes(q)) return 100;

  // bigram แบบไม่ซ้ำ กันข้อความซ้ำๆ บิดเบือนคะแนน
  const bigrams = new Set<string>();
  for (let i = 0; i <= q.length - 2; i++) {
    bigrams.add(q.substring(i, i + 2));
  }
  if (bigrams.size === 0) return 0;

  let matched = 0;
  for (const b of bigrams) {
    if (t.includes(b) || (ti.length > 0 && ti.includes(b))) {
      matched++;
    }
  }

  return Math.min(100, Math.max(0, Math.round((matched / bigrams.size) * 100)));
}
