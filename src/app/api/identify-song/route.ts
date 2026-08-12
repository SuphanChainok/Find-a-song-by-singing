import { NextResponse } from 'next/server';
import { searchSongs } from '@/lib/dataset-search';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'ไม่พบคำค้นหา' },
        { status: 400 }
      );
    }

    // ค้นหาเพลงใน CSV
    const matches = searchSongs(query);

    return NextResponse.json({
      success: true,
      transcribed_text: query,
      results: matches,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหา' },
      { status: 500 }
    );
  }
}