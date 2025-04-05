import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Next.js 14의 새로운 설정 방식 사용
export const dynamic = 'force-dynamic'; // 모든 요청을 동적으로 처리
export const runtime = 'nodejs'; // Node.js 런타임 사용

// 파일 제공을 위한 GET 라우트 핸들러
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 경로 배열을 문자열로 결합
  const filePath = params.path.join('/');

  // URL 디코딩 추가
  const decodedPath = params.path.map(segment => decodeURIComponent(segment)).join('/');
  
  // 파일 경로 생성 - uploads 디렉토리 내에서 찾음
  const uploadDir = path.join(process.cwd(), "uploads");
  const fullPath = path.join(uploadDir, decodedPath);
  
  // 경로 검증 - uploads 디렉토리 외부 접근 방지 (디렉토리 트래버설 공격 방지)
  const normalizedFullPath = path.normalize(fullPath);
  if (!normalizedFullPath.startsWith(uploadDir)) {
    return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 403 });
  }
  
  // 파일이 존재하는지 확인
  if (!existsSync(normalizedFullPath)) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }
  
  try {
    // 파일 읽기
    const fileData = await readFile(normalizedFullPath);
    
    // MIME 타입 결정
    let contentType = "application/octet-stream";
    const ext = path.extname(filePath).toLowerCase();
    
    // 확장자에 따른 MIME 타입 설정
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.heic':
      case '.heif':
        contentType = 'image/heic'; // HEIC/HEIF 형식 지원 추가
        break;
      // 필요한 다른 형식 추가
    }
    
    // 브라우저 캐싱 설정
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // 1년 캐싱
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
    };
    
    // 파일 응답 반환
    return new NextResponse(fileData, { headers });
  } catch (error) {
    console.error(`파일 제공 오류: ${error}`);
    return NextResponse.json({ error: "파일을 제공하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}