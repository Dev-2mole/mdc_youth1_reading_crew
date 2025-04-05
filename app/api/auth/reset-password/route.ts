// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, pastorName, pastorPhone } = body

    // 입력 값 검증
    if (!id || !name || !pastorName || !pastorPhone) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 })
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id },
    })

    // 사용자가 존재하지 않거나 이름이 일치하지 않으면
    if (!user || user.name !== name) {
      return NextResponse.json({ error: "존재하지 않는 계정입니다. 추가 문의는 담당 리더에게 연락해주세요." }, { status: 404 })
    }

    // 목사님 정보 확인
    if (pastorName !== "조성공" || pastorPhone !== "01093588250") {
      return NextResponse.json({ error: "입력하신 정보가 올바르지 않습니다." }, { status: 400 })
    }

    // 임시 비밀번호 생성 (8자리 랜덤 문자열)
    const tempPassword = Math.random().toString(36).slice(-8);

    // 비밀번호 해싱
    const hashedPassword = await hash(tempPassword, 10)

    // 사용자 비밀번호 업데이트
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        // Prisma 스키마에 passwordReset 필드가 없는 경우 이 부분은 제거 또는 주석 처리
        passwordReset: true, 
      },
    })

    return NextResponse.json({ 
      message: `${name}님의 비밀번호가 초기화되었습니다.`,
      id,
      tempPassword
    })
  } catch (error) {
    console.error("비밀번호 초기화 오류:", error)
    return NextResponse.json({ error: "비밀번호 초기화 중 오류가 발생했습니다." }, { status: 500 })
  }
}