import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 사용자 역할만 업데이트하는 전용 엔드포인트 (PUT)
export async function PUT(req: Request) {
  try {
    const { id, role } = await req.json()
    
    console.log("Updating user role:", { id, role })
    
    // id나 role이 없는 경우 오류 반환
    if (!id) {
      return NextResponse.json({ error: "사용자 ID가 필요합니다." }, { status: 400 })
    }
    
    if (!role) {
      return NextResponse.json({ error: "역할 정보가 필요합니다." }, { status: 400 })
    }
    
    // 유효한 role 값인지 확인
    if (!["admin", "leader", "member"].includes(role)) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 })
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      include: { team: true }
    })
    
    console.log("User role updated successfully:", updatedUser)
    
    // 간소화된 응답 데이터
    const responseData = {
      id: updatedUser.id,
      role: updatedUser.role as "admin" | "leader" | "member"
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "사용자 역할 업데이트 실패" }, { status: 500 })
  }
}