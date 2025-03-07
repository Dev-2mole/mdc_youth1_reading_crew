// app/api/teams/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 모든 팀 가져오기 (GET)
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: { users: true },
    });
    // users를 members로 매핑
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      members: team.users || [],
    }));
    return NextResponse.json(formattedTeams);
  } catch (error) {
    return NextResponse.json({ error: "팀을 불러오는데 실패했습니다." }, { status: 500 });
  }
}


// 팀 추가 (POST)
export async function POST(req: Request) {
  try {
    const { name, color } = await req.json()
    const newTeam = await prisma.team.create({
      data: { name, color },
    })
    // 새 팀 객체에 빈 사용자 배열 추가
    return NextResponse.json({ ...newTeam, users: [] })
  } catch (error) {
    return NextResponse.json({ error: "팀 추가 실패" }, { status: 500 })
  }
}


// 팀 수정 (PUT)
export async function PUT(req: Request) {
  try {
    const { id, name, color } = await req.json()
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { name, color },
    })
    return NextResponse.json(updatedTeam)
  } catch (error) {
    return NextResponse.json({ error: "팀 수정 실패" }, { status: 500 })
  }
}

// 팀 삭제 (DELETE)
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    await prisma.team.delete({ where: { id } })
    return NextResponse.json({ message: "팀 삭제 완료" })
  } catch (error) {
    return NextResponse.json({ error: "팀 삭제 실패" }, { status: 500 })
  }
}


