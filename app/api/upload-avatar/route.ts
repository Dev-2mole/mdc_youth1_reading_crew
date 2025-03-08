import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Next.js 14의 새로운 설정 방식 사용
export const dynamic = 'force-dynamic'; // 모든 요청을 동적으로 처리
export const runtime = 'nodejs'; // Node.js 런타임 사용

// 업로드 디렉토리를 프로젝트 루트의 uploads 폴더로 변경
const uploadDir = path.join(process.cwd(), "uploads");

// 최대 파일 크기 설정 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    // 업로드 디렉토리가 존재하지 않으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // FormData 객체로 요청 처리
    const formData = await req.formData();
    
    // userId 가져오기
    const userId = formData.get('userId') as string || 'unknown';
    
    // 파일 가져오기
    const file = formData.get('avatar') as File | null;
    
    // 파일이 없는 경우 오류 반환
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    
    // 파일 크기 제한 검사
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일 크기가 너무 큽니다. 최대 10MB까지 가능합니다." }, { status: 400 });
    }
    
    // 파일 형식 검사 (이미지 파일인지 확인하되, 더 넓은 범위의 형식 허용)
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image') {
      return NextResponse.json({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
    }
    
    // 파일 확장자 추출
    let ext = '.' + (file.type.split('/').pop() || 'jpg');
    // HEIC/HEIF 파일 처리 (iOS 기기에서 주로 사용)
    if (ext === '.heic' || ext === '.heif') {
      // HEIC/HEIF는 브라우저 지원이 제한적이므로 jpg로 저장 (실제로는 변환 필요)
      ext = '.jpg';
    } else if (ext === '.jpeg') {
      ext = '.jpg';
    }
    
    // 새 파일 이름 생성
    const newFilename = `${userId}_${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newFilename);
    
    try {
      // 파일을 ArrayBuffer로 읽고 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // 파일 쓰기
      await writeFile(newPath, buffer);
      
      // API 라우트를 통해 파일에 접근할 수 있는 URL 경로 반환
      return NextResponse.json({ path: `/api/files/${newFilename}` });
    } catch (error) {
      console.error("파일 저장 실패:", error);
      return NextResponse.json({ error: "파일 저장에 실패했습니다." }, { status: 500 });
    }
  } catch (error) {
    console.error("파일 업로드 처리 실패:", error);
    return NextResponse.json({ error: "업로드 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}