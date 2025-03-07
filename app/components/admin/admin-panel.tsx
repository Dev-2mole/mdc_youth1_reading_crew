"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Edit, Trash, Plus, MessageSquare } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TeamMember {
  id: string
  name: string
  avatar: string
  progress: number
  goal: number
  dailyChecks: boolean[]
  role?: "admin" | "leader" | "member"
}

interface Team {
  id: string
  name: string
  color: string
  members: TeamMember[]
}

interface AdminPanelProps {
  teams: Team[]
  onUpdateTeams: (teams: Team[]) => void
  isAdmin: boolean
  chatLogs: ChatLogMessage[] // 채팅 로그 추가
}

interface ChatLogMessage {
  id: string
  userId?: string
  userName: string
  userAvatar: string
  message: string
  timestamp: Date
}

export function AdminPanel({ teams, onUpdateTeams, isAdmin, chatLogs }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  // Team management state
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false)
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamColor, setNewTeamColor] = useState("#FF4444")

  // User management state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<(TeamMember & { teamId: string }) | null>(null)
  const [editUserName, setEditUserName] = useState("")
  const [editUserTeamId, setEditUserTeamId] = useState("")
  const [editUserRole, setEditUserRole] = useState<"admin" | "leader" | "member">("member")
  const [editUserAvatar, setEditUserAvatar] = useState("")

  // Chat log state
  const [chatLogSearch, setChatLogSearch] = useState("")
  const [chatLogFilter, setChatLogFilter] = useState("all")
  // 채팅 로그는 props로 받아옴

  // Function to format chat time
  const formatChatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}일 전`
    } else if (hours > 0) {
      return `${hours}시간 전`
    } else if (minutes > 0) {
      return `${minutes}분 전`
    } else {
      return "방금 전"
    }
  }

  // Function to filter chat logs
  const getFilteredChatLogs = () => {
    // 외부에서 받은 chatLogs 사용
    let filteredLogs = chatLogs

    if (chatLogSearch) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.userName.toLowerCase().includes(chatLogSearch.toLowerCase()) ||
          log.message.toLowerCase().includes(chatLogSearch.toLowerCase()),
      )
    }

    if (chatLogFilter !== "all") {
      const now = new Date()
      let startDate: Date

      switch (chatLogFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "yesterday":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          break
        case "thisWeek":
          const dayOfWeek = now.getDay()
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
          startDate = new Date(now.getFullYear(), now.getMonth(), diff)
          break
        default:
          startDate = new Date(0)
      }

      filteredLogs = filteredLogs.filter((log) => log.timestamp >= startDate)
    }

    // 최신 메시지가 위로 오도록 정렬
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Function to update a user's role
  const updateUserRole = (teamId: string, userId: string, newRole: "admin" | "leader" | "member") => {
    const updatedTeams = teams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members.map((member) => {
            if (member.id === userId) {
              return {
                ...member,
                role: newRole,
              }
            }
            return member
          }),
        }
      }
      return team
    })

    onUpdateTeams(updatedTeams)
  }

  // 팀 추가
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      alert("팀 이름을 입력해주세요.")
      return
    }
  
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName, color: newTeamColor }),
      })
  
      if (!response.ok) throw new Error("팀 추가 실패")
  
      const newTeam = await response.json()
      onUpdateTeams([...teams, { ...newTeam, members: newTeam.users || [] }])
      setNewTeamName("")
      setNewTeamColor("#FF4444")
      setIsAddTeamOpen(false)
    } catch (error) {
      console.error(error)
      alert("팀 추가 중 오류 발생")
    }
  }
  

  // 팀 수정
  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) {
      alert("팀 이름을 입력해주세요.")
      return
    }
  
    try {
      const response = await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTeam.id, name: newTeamName, color: newTeamColor }),
      })
  
      if (!response.ok) throw new Error("팀 수정 실패")
  
      const updatedTeam = await response.json()
      const updatedTeams = teams.map((team) =>
        team.id === updatedTeam.id ? updatedTeam : team
      )
      onUpdateTeams(updatedTeams)
      setIsEditTeamOpen(false)
    } catch (error) {
      console.error(error)
      alert("팀 수정 중 오류 발생")
    }
  }  

  // Function to delete a team
  const handleDeleteTeam = async (teamId: string) => {
    setIsOpen(false)
  
    try {
      const response = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teamId }),
      })
  
      if (!response.ok) throw new Error("팀 삭제 실패")
  
      setTimeout(() => {
        const updatedTeams = teams.filter((team) => team.id !== teamId)
        onUpdateTeams(updatedTeams)
      }, 100)
    } catch (error) {
      console.error(error)
      alert("팀 삭제 중 오류 발생")
    }
  }
  

  // Function to open edit team dialog
  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team)
    setNewTeamName(team.name)
    setNewTeamColor(team.color)
    setIsEditTeamOpen(true)
  }

  // Function to open edit user dialog
  const openEditUserDialog = (user: TeamMember & { teamId: string }) => {
    setEditingUser(user)
    setEditUserName(user.name)
    setEditUserTeamId(user.teamId)
    setEditUserRole(user.role || "member")
    setEditUserAvatar(user.avatar)
    setIsEditUserOpen(true)
  }

  // Function to update a user
  const handleUpdateUser = () => {
    if (!editingUser) return
    if (!editUserName.trim()) {
      alert("사용자 이름을 입력해주세요.")
      return
    }

    // Check if team changed
    const isTeamChanged = editingUser.teamId !== editUserTeamId

    const updatedTeams = teams.map((team) => {
      // If this is the new team, add the user
      if (team.id === editUserTeamId) {
        // If team didn't change, just update the user
        if (!isTeamChanged) {
          return {
            ...team,
            members: team.members.map((member) => {
              if (member.id === editingUser.id) {
                return {
                  ...member,
                  name: editUserName,
                  avatar: editUserAvatar,
                  role: editUserRole,
                }
              }
              return member
            }),
          }
        }
        // If team changed, add user to new team
        else {
          const updatedMember = {
            ...editingUser,
            name: editUserName,
            avatar: editUserAvatar,
            role: editUserRole,
          }
          return {
            ...team,
            members: [...team.members, updatedMember],
          }
        }
      }

      // If this is the old team and team changed, remove the user
      if (isTeamChanged && team.id === editingUser.teamId) {
        return {
          ...team,
          members: team.members.filter((member) => member.id !== editingUser.id),
        }
      }

      return team
    })

    onUpdateTeams(updatedTeams)
    setIsEditUserOpen(false)
  }

  // Get all users across all teams
  const allUsers = teams.flatMap((team) =>
    team.members.map((member) => ({
      ...member,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
    })),
  )

  // Only show the admin panel button if the user is an admin
  if (!isAdmin) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ShieldCheck className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>관리자 패널</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="teams">팀 관리</TabsTrigger>
            <TabsTrigger value="add-team">팀 추가/수정</TabsTrigger>
            <TabsTrigger value="chat-logs">채팅 로그</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>사용자 권한 관리</CardTitle>
                <CardDescription>사용자의 역할을 변경하여 권한을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>ID: {user.id}</span>
                            <Badge variant="outline" style={{ backgroundColor: user.teamColor, color: "white" }}>
                              {user.teamName}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.role === "admin" ? "default" : user.role === "leader" ? "secondary" : "outline"}
                        >
                          {user.role === "admin" ? "관리자" : user.role === "leader" ? "팀장" : "일반"}
                        </Badge>

                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            updateUserRole(user.teamId, user.id, value as "admin" | "leader" | "member")
                          }
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">관리자</SelectItem>
                            <SelectItem value="leader">팀장</SelectItem>
                            <SelectItem value="member">일반</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" onClick={() => openEditUserDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>팀 관리</CardTitle>
                <CardDescription>각 팀의 구성원과 진행 상황을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teams.map((team) => (
                    <div key={team.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                          <h3 className="text-lg font-semibold">{team.name}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditTeamDialog(team)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>팀 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 "{team.name}" 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 팀의 모든 멤버
                                  데이터가 삭제됩니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    handleDeleteTeam(team.id)
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="pl-5 space-y-2">
                        {team.members.length === 0 ? (
                          <p className="text-sm text-muted-foreground">팀원이 없습니다.</p>
                        ) : (
                          team.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar} alt={member.name} />
                                  <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    member.role === "admin"
                                      ? "default"
                                      : member.role === "leader"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {member.role === "admin" ? "관리자" : member.role === "leader" ? "팀장" : "일반"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">진행률: {member.progress}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-team" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>팀 추가</CardTitle>
                <CardDescription>새로운 팀을 추가합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-team-name">팀 이름</Label>
                      <Input
                        id="new-team-name"
                        placeholder="새 팀 이름"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-team-color">팀 색상</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="new-team-color"
                          type="color"
                          value={newTeamColor}
                          onChange={(e) => setNewTeamColor(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: newTeamColor }} />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddTeam} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />팀 추가하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat-logs" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>채팅 로그</CardTitle>
                <CardDescription>모든 채팅 기록을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="사용자 이름 또는 메시지 검색..."
                        value={chatLogSearch}
                        onChange={(e) => setChatLogSearch(e.target.value)}
                      />
                    </div>
                    <Select value={chatLogFilter} onValueChange={setChatLogFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="기간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 기간</SelectItem>
                        <SelectItem value="today">오늘</SelectItem>
                        <SelectItem value="yesterday">어제</SelectItem>
                        <SelectItem value="thisWeek">이번 주</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[400px] border rounded-md p-4">
                    <div className="space-y-4">
                      {getFilteredChatLogs().length > 0 ? (
                        getFilteredChatLogs().map((message) => (
                          <div key={message.id} className="flex gap-3 border-b pb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.userAvatar} alt={message.userName} />
                              <AvatarFallback>{message.userName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{message.userName}</p>
                                <span className="text-xs text-muted-foreground">
                                  {formatChatTime(message.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{message.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">채팅 로그가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 정보 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">팀 이름</Label>
              <Input id="edit-team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-team-color">팀 색상</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-team-color"
                  type="color"
                  value={newTeamColor}
                  onChange={(e) => setNewTeamColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: newTeamColor }} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTeamOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateTeam}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={editUserAvatar} alt={editUserName} />
                <AvatarFallback>{editUserName?.substring(0, 2) || "사용자"}</AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-name">이름</Label>
              <Input id="edit-user-name" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-team">팀</Label>
              <Select value={editUserTeamId} onValueChange={setEditUserTeamId}>
                <SelectTrigger id="edit-user-team">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-role">역할</Label>
              <Select
                value={editUserRole}
                onValueChange={(value) => setEditUserRole(value as "admin" | "leader" | "member")}
              >
                <SelectTrigger id="edit-user-role">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="leader">팀장</SelectItem>
                  <SelectItem value="member">일반</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-avatar">아바타 URL</Label>
              <Input
                id="edit-user-avatar"
                value={editUserAvatar}
                onChange={(e) => setEditUserAvatar(e.target.value)}
                placeholder="아바타 이미지 URL"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateUser}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}


