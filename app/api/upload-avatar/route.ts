// app/api/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { IncomingForm, File as FormidableFile, Fields, Files } from "formidable";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { promisify } from "util";

// Next.js 14의 새로운 설정 방식 사용
export const dynamic = 'force-dynamic'; // 모든 요청을 동적으로 처리
export const runtime = 'nodejs'; // Node.js 런타임 사용

// 업로드 디렉토리를 프로젝트 루트의 uploads 폴더로 변경
const uploadDir = path.join(process.cwd(), "uploads");

// 업로드 디렉토리가 존재하지 않으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// `fs.rename`을 Promise 기반으로 변환
const renameFile = promisify(fs.rename);

export async function POST(req: NextRequest) {
  try {
    // 요청 body를 arrayBuffer로 읽어오기
    const buf = await req.arrayBuffer();
    const buffer = Buffer.from(buf);

    // Readable.from을 사용하여 스트림 생성
    const nodeReq = Readable.from(buffer) as any;
    nodeReq.headers = Object.fromEntries(req.headers.entries());
    nodeReq.method = req.method;

    // formidable 설정
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB 제한
    });

    // `form.parse`를 Promise로 변환
    const parseForm = (): Promise<{ fields: Fields; files: Files }> =>
      new Promise((resolve, reject) => {
        form.parse(nodeReq, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    // form 데이터 파싱
    const { fields = {}, files = {} } = await parseForm();

    // userId 처리
    const rawUserId = fields.userId;

    // userId가 string[]인지, string인지, undefined인지 안전하게 처리
    let userId: string;
    if (Array.isArray(rawUserId)) {
      userId = rawUserId[0] ?? "unknown";
    } else if (typeof rawUserId === "string") {
      userId = rawUserId;
    } else {
      userId = "unknown";
    }

    // 파일 처리
    let file = files.avatar as FormidableFile | FormidableFile[] | undefined;
    if (Array.isArray(file)) {
      file = file[0];
    }
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 새 파일 이름 생성 및 이동
    const ext = path.extname(file.originalFilename ?? "");
    const newFilename = `${userId}_${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newFilename);

    await renameFile(file.filepath, newPath);

    // API 라우트를 통해 파일에 접근할 수 있는 URL 경로 반환
    return NextResponse.json({ path: `/api/files/${newFilename}` });
  } catch (error) {
    console.error("파일 업로드 실패:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
