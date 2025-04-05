// app/api/auth/change-password/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, newPassword } = body

    // 입력 값 검증
    if (!id || !newPassword) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 })
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "존재하지 않는 계정입니다." }, { status: 404 })
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(newPassword, 10)

    // 사용자 비밀번호 업데이트
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        // Prisma 스키마에 passwordReset 필드가 없는 경우 이 부분은 제거 또는 주석 처리
        passwordReset: false, 
      },
    })

    return NextResponse.json({ 
      message: "비밀번호가 성공적으로 변경되었습니다."
    })
  } catch (error) {
    console.error("비밀번호 변경 오류:", error)
    return NextResponse.json({ error: "비밀번호 변경 중 오류가 발생했습니다." }, { status: 500 })
  }
}