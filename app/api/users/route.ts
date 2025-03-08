import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 사용자 정보 가져오기 (GET)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { team: true },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "사용자 정보를 불러오는데 실패했습니다." }, { status: 500 })
  }
}

// 사용자 정보 업데이트 (PUT)
export async function PUT(req: Request) {
  try {
    const { id, name, teamId, role, avatar } = await req.json()
    
    console.log("Updating user info:", { id, name, teamId, role, avatar })
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        teamId,
        role,
        avatar,
      },
      include: {
        team: true
      }
    })
    
    console.log("User updated successfully:", updatedUser)
    
    // UserData 인터페이스에 맞게 응답 데이터 구성
    const responseData = {
      id: updatedUser.id,
      name: updatedUser.name,
      cohort: updatedUser.cohort || "",
      teamId: updatedUser.teamId || "",
      avatar: updatedUser.avatar || "",
      role: updatedUser.role as "admin" | "leader" | "member"
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "사용자 정보 업데이트 실패" }, { status: 500 })
  }
}

// 사용자 삭제 (DELETE)
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "사용자 삭제 완료" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "사용자 삭제 실패" }, { status: 500 })
  }
}