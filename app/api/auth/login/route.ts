import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { compare } from "bcrypt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password } = body

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

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 })
  }
}

