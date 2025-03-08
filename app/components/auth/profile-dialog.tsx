"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UserData } from "../../types"  // 공통 타입을 상대경로로 import

interface ProfileDialogProps {
  user: UserData | null
  teams: { id: string; name: string }[]
  onUpdateProfile: (updatedUser: UserData) => void
  onLogout: () => void
}

export function ProfileDialog({ user, teams, onUpdateProfile, onLogout }: ProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [cohort, setCohort] = useState("")
  const [teamId, setTeamId] = useState("")
  const [avatar, setAvatar] = useState("")
  const [avatarPreview, setAvatarPreview] = useState("")

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 다이얼로그 오픈 시 폼 초기화
  const handleOpenChange = (open: boolean) => {
    if (open && user) {
      setName(user.name)
      setPassword("") // 실제 비밀번호는 표시하지 않음
      setCohort(user.cohort)
      setTeamId(user.teamId)
      setAvatar(user.avatar)
      setAvatarPreview(user.avatar)
      setIsEditing(false)
    }
    setIsOpen(open)
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  // 파일 선택 시 서버로 업로드 후, 반환받은 경로로 아바타 업데이트
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.")
        return
      }

      // FormData 생성: 파일과 사용자 ID(파일명 생성에 활용)를 전송
      const formData = new FormData()
      formData.append("avatar", file)
      if (user) {
        formData.append("userId", user.id)
      }

      try {
        const response = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          throw new Error("파일 업로드 실패")
        }
        const data = await response.json()
        // 서버에서 반환한 파일 경로를 사용
        const newAvatarPath = data.path
        setAvatar(newAvatarPath)
        setAvatarPreview(newAvatarPath)
      } catch (error: any) {
        console.error("파일 업로드 오류:", error)
        alert(error.message)
      }
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSave = () => {
    if (!user) return

    if (!name || !cohort || !teamId) {
      alert("모든 필수 항목을 입력해주세요.")
      return
    }

    // updatedUser 객체를 생성할 때, password가 없으면 user.password가 undefined일 수 있으므로 기본값으로 빈 문자열("")을 사용
    const updatedUser: UserData = {
      ...user,
      name,
      cohort,
      teamId,
      avatar,
      password: password ? password : (user.password ?? ""),
    }

    onUpdateProfile(updatedUser)
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full p-1">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>내 프로필</DialogTitle>
          <DialogDescription>
            {isEditing ? "프로필 정보를 수정하세요." : "내 계정 정보를 확인하세요."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center mb-4">
          <div className="relative" onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24 cursor-pointer border-2 border-primary/20">
              <AvatarImage src={avatarPreview} alt={name} />
              <AvatarFallback>{name.substring(0, 2) || <User />}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                <Upload className="h-6 w-6" />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            )}
            {isEditing && (
              <div className="absolute -bottom-2 right-0 bg-primary text-white p-1 rounded-full shadow-md">
                <Upload className="h-4 w-4" />
              </div>
            )}
          </div>
          <h3 className="text-lg font-medium mt-2">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.id}</p>
          {user.role && (
            <Badge
              variant={user.role === "admin" ? "default" : user.role === "leader" ? "secondary" : "outline"}
              className="mt-1"
            >
              {user.role === "admin" ? "관리자" : user.role === "leader" ? "팀장" : "일반"}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-id">아이디</Label>
            <Input id="profile-id" value={user.id} disabled className="bg-muted" />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="profile-password">새 비밀번호</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="변경할 비밀번호를 입력하세요"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="profile-name">이름</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-cohort">기수</Label>
            {isEditing ? (
              <Select value={cohort} onValueChange={setCohort}>
                <SelectTrigger id="profile-cohort">
                  <SelectValue placeholder="기수를 선택하세요" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {Array.from({ length: 8 }, (_, i) => i + 41).map((cohortNum) => (
                    <SelectItem key={cohortNum} value={cohortNum.toString()}>
                      {cohortNum}기
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input id="profile-cohort" value={`${cohort}기`} disabled className="bg-muted" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-team">팀</Label>
            {isEditing ? (
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger id="profile-team">
                  <SelectValue placeholder="팀을 선택하세요" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="profile-team"
                value={teams.find((t) => t.id === teamId)?.name || ""}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          <div className="flex justify-between pt-4 pb-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button onClick={handleSave}>저장</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onLogout}>
                  로그아웃
                </Button>
                <Button onClick={handleEditToggle}>수정</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}