import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const logs = await prisma.chatLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, message } = body

    const chatLog = await prisma.chatLog.create({
      data: {
        userId,
        message,
        timestamp: new Date(),
      },
    })

    return NextResponse.json(chatLog)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create chat log" }, { status: 500 })
  }
}

