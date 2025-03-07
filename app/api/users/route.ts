import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: true,
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, password, cohort, teamId, avatar, role } = body

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        cohort,
        teamId,
        avatar,
        role: role || "member",
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

