import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const progress = await prisma.progress.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("GET /api/progress error:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, date, completed } = body

    if (!userId || !date || typeof completed !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0) // Normalize to start of day

    // 기존에 존재하는 레코드 확인
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId,
        date: dateOnly,
      },
    })

    let progress

    if (existingProgress) {
      // 업데이트
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: { completed },
      })
    } else {
      // 새로 생성
      progress = await prisma.progress.create({
        data: {
          userId,
          date: dateOnly,
          completed,
        },
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error("POST /api/progress error:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}
