import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { compare } from "bcrypt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password } = body

    console.log("로그인 요청:", body)

    // 입력된 값 검증
    if (!id || !password) {
      console.log("로그인 실패: 아이디 또는 비밀번호 누락")
      return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 })
    }

    // 유저 조회
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      console.log("로그인 실패: 존재하지 않는 ID")
      return NextResponse.json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    console.log("DB 저장된 해시 비밀번호:", user.password) // 해시된 비밀번호 확인

    // 비밀번호 검증 (해시된 비밀번호와 비교)
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      console.log("로그인 실패: 비밀번호 불일치")
      return NextResponse.json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    // 비밀번호 제외 후 유저 데이터 반환
    const { password: _, ...userWithoutPassword } = user

    console.log("로그인 성공:", userWithoutPassword)
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("로그인 API 에러:", error)
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 })
  }
}
