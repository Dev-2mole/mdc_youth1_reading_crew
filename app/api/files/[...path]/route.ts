// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Next.js 14의 새로운 설정 방식 사용
export const dynamic = 'force-dynamic'; // 모든 요청을 동적으로 처리
export const runtime = 'nodejs'; // Node.js 런타임 사용

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 요청된 파일 경로 구성
    const filePath = path.join(process.cwd(), 'uploads', ...params.path);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 파일 읽기
    const fileBuffer = fs.readFileSync(filePath);
    
    // 파일 확장자에 따른 MIME 타입 설정
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      // 필요한 다른 MIME 타입 추가
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // 응답 생성
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 캐싱 설정 (1년)
      },
    });
  } catch (error) {
    console.error('파일 서빙 오류:', error);
    return NextResponse.json({ error: '파일 서빙 실패' }, { status: 500 });
  }
}
