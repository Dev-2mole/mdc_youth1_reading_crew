import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password, name, cohort, teamId } = body

    // 아이디 중복 검사
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 400 })
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10)

    // 유저 생성
    const newUser = await prisma.user.create({
      data: {
        id,
        password: hashedPassword,
        name,
        cohort,
        teamId,
        avatar: "/default.png", // 기본 프로필
        role: "member", // 기본 권한
      },
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error("회원가입 API 에러:", error)
    return NextResponse.json({ error: "회원가입 실패" }, { status: 500 })
  }
}
