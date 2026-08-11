// เปลี่ยนจาก '@/lib/search-dataset' เป็น '@/lib/dataset-search'
import { searchSongs } from '@/lib/dataset-search'; 
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'ไม่พบข้อความเนื้อร้องที่ส่งมา' },
        { status: 400 }
      );
    }

    // ค้นหาเพลงใน CSV จากข้อความร้อง
    const matches = searchSongs(query);

    return NextResponse.json({
      success: true,
      transcribed_text: query,
      results: matches,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' },
      { status: 500 }
    );
  }
}