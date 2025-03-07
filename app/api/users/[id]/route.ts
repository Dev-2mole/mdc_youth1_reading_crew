import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { team: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 비밀번호 필드 제외하고 반환
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, password, cohort, teamId, avatar, role } = body

    // 사용자 존재 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      name,
      cohort,
      teamId,
      role,
    }

    // 아바타가 제공된 경우에만 업데이트
    if (avatar) {
      updateData.avatar = avatar
    }

    // 비밀번호가 제공된 경우에만 해싱하여 업데이트
    if (password) {
      updateData.password = await hash(password, 10)
    }

    // 사용자 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: { team: true },
    })

    // 비밀번호 필드 제외하고 반환
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // 사용자 존재 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 사용자 삭제 전 관련 데이터 삭제
    await prisma.chatMessage.deleteMany({
      where: { userId: params.id },
    })

    await prisma.chatLog.deleteMany({
      where: { userId: params.id },
    })

    await prisma.progress.deleteMany({
      where: { userId: params.id },
    })

    // 사용자 삭제
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

