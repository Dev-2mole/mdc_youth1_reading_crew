// app/api/auth/auto-login/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { compare } from "bcrypt"
import { sign, verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'

// 환경 변수 사용
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password, rememberMe } = body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    // 비밀번호 제외 후 응답
    const { password: _, ...userWithoutPassword } = user

    // 자동 로그인 설정 (rememberMe가 true인 경우)
    if (rememberMe) {
      // JWT 토큰 생성 (30일 유효)
      const token = sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
      
      // 쿠키에 토큰 저장
      cookies().set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30일
        path: '/',
      });
    }

    return NextResponse.json({
      ...userWithoutPassword,
      autoLogin: rememberMe // 자동 로그인 상태 포함
    })
  } catch (error) {
    console.error("로그인 실패:", error)
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 })
  }
}

// 자동 로그인 확인 API
export async function GET() {
  try {
    // 쿠키에서 토큰 가져오기
    const authToken = cookies().get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: "인증 토큰이 없습니다." }, { status: 401 });
    }
    
    // 토큰 검증
    const decoded = verify(authToken, JWT_SECRET) as { userId: string };
    
    // 유저 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // 비밀번호 필드 제외
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("자동 로그인 검증 실패:", error);
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }
}

// 로그아웃 시 쿠키 삭제
export async function DELETE() {
  cookies().delete('auth_token');
  return NextResponse.json({ message: "로그아웃 되었습니다." });
}