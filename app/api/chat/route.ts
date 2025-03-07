import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      include: {
        user: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, message } = body

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId,
        message,
        timestamp: new Date(),
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(chatMessage)
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

