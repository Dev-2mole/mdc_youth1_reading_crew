import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        users: true,
      },
    })
    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, color } = body

    const team = await prisma.team.create({
      data: {
        name,
        color,
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

