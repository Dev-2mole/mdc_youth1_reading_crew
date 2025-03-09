"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, User, Megaphone, Car, Flag, BookOpen, Trophy, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { LoginDialog } from "./components/auth/login-dialog"
import { ProfileDialog } from "./components/auth/profile-dialog"
import { AdminPanel } from "./components/admin/admin-panel"
import { Badge } from "@/components/ui/badge"
import { ProgressCalendar } from "./components/progress-calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "./components/theme-toggle"

// 공통 타입 import (UserData, Team, ChatMessage, TeamMember)
import { UserData, Team, ChatMessage, TeamMember } from "./types"

// 날짜 생성 함수
const generateWeekdayDates = () => {
  const startDate = new Date(2025, 2, 10) // March 10, 2025
  const endDate = new Date(2025, 4, 9) // May 9, 2025
  const dates: Date[] = []

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// 날짜 포맷 함수
const formatDate = (date: Date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 채팅 시간 표시 함수
const formatTime = (date: Date) => {
  const today = new Date()
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else {
    return (
      date.toLocaleDateString([], { month: "2-digit", day: "2-digit" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }
}

export default function TeamProgressPage() {
  // 상태 변수들
  const [teamsState, setTeamsState] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<{id: string, name: string}[]>([]) // Dev Team을 포함한 모든 팀
  const [activeTeam, setActiveTeam] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [activeView, setActiveView] = useState<"track" | "members">("track")
  const [loggedInUser, setLoggedInUser] = useState<UserData | null>(null)
  const [weekdayDates] = useState(generateWeekdayDates())
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const trackRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 팀 데이터 가져오기
        const teamsResponse = await fetch("/api/teams")
        const teamsData = await teamsResponse.json()
        
        // 대시보드 표시용 팀 데이터 (Dev Team 제외)
        const filteredTeamsData = teamsData.filter((team: any) => team.name !== "Dev Team")
        
        // 로그인/채팅용 전체 팀 데이터 (Dev Team 포함)
        const allTeamsData = teamsData

        // 사용자 데이터 가져오기
        const usersResponse = await fetch("/api/users")
        const usersData = await usersResponse.json()

        // 채팅 메시지 가져오기
        const chatResponse = await fetch("/api/chat")
        const chatData = await chatResponse.json()

        // 채팅 로그 가져오기
        const logsResponse = await fetch("/api/chat/logs")
        const logsData = await logsResponse.json()

        // 대시보드용 팀 데이터 구성 (Dev Team 제외)
        const formattedTeams = filteredTeamsData.map((team: any) => {
          const teamUsers = usersData.filter((user: any) => user.teamId === team.id)

          // 각 사용자의 진행 상황 계산
          const teamMembers = teamUsers.map((user: any) => {
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar || "/placeholder.svg?height=32&width=32",
              progress: 0, // 초기값, 나중에 업데이트됨
              goal: 100,
              dailyChecks: Array(45).fill(false), // 초기값, 나중에 업데이트됨
              role: user.role,
            }
          })

          return {
            id: team.id,
            name: team.name,
            color: team.color,
            members: teamMembers,
          }
        })

        // 로그인 다이얼로그용 전체 팀 데이터 구성 (Dev Team 포함)
        const formattedAllTeams = allTeamsData.map((team: any) => ({
          id: team.id,
          name: team.name,
        }))

        setTeamsState(formattedTeams)
        setAllTeams(formattedAllTeams)
        
        if (formattedTeams.length > 0) {
          setActiveTeam(formattedTeams[0].id)
        }
        
        // 채팅 메시지 포맷
        const formattedChatMessages = chatData.map((msg: any) => ({
          id: msg.id,
          userId: msg.userId,
          userName: msg.user.name,
          userAvatar: msg.user.avatar || "/placeholder.svg?height=40&width=40",
          message: msg.message,
          timestamp: new Date(msg.timestamp),
        }))

        // 채팅 로그 포맷
        const formattedChatLogs = logsData.map((log: any) => ({
          id: log.id,
          userId: log.userId,
          userName: log.user.name,
          userAvatar: log.user.avatar || "/placeholder.svg?height=40&width=40",
          message: log.message,
          timestamp: new Date(log.timestamp),
        }))

        setChatMessages(formattedChatMessages)
        setChatLogs(formattedChatLogs)

        // 각 사용자의 진행 상황 가져오기
        for (const team of formattedTeams) {
          for (const member of team.members) {
            fetchUserProgress(member.id)
          }
        }
      } catch (error) {
        console.error("데이터 가져오기 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // 다크 모드 설정
    const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // 사용자 진행 상황 가져오기
  const fetchUserProgress = async (userId: string) => {
    try {
      const response = await fetch(`/api/progress?userId=${userId}`)
      const progressData = await response.json()

      // 진행 상황 데이터를 dailyChecks 배열로 변환
      const dailyChecks = Array(45).fill(false)
      let completedCount = 0

      progressData.forEach((item: any, index: number) => {
        if (index < 45) {
          dailyChecks[index] = item.completed
          if (item.completed) completedCount++
        }
      })

      // 진행률 계산
      const progress = Math.round((completedCount / 45) * 100)

      // 팀 상태 업데이트
      setTeamsState((prevTeams) => {
        return prevTeams.map((team) => {
          return {
            ...team,
            members: team.members.map((member) => {
              if (member.id === userId) {
                return {
                  ...member,
                  progress,
                  dailyChecks,
                }
              }
              return member
            }),
          }
        })
      })
    } catch (error) {
      console.error(`사용자 ${userId}의 진행 상황 가져오기 실패:`, error)
    }
  }

  // 체크박스 변경 처리
  const handleCheckboxChange = async (teamId: string, userId: string, dayIndex: number) => {
    if (!loggedInUser) return

    const isAdmin = loggedInUser.role === "admin"
    const isTeamLeader = loggedInUser.role === "leader" && loggedInUser.teamId === teamId
    const isOwnCheckbox = loggedInUser.id === userId

    if (!isAdmin && !isTeamLeader && !isOwnCheckbox) {
      alert("권한이 없습니다.")
      return
    }

    const today = new Date()
    const checkDate = weekdayDates[dayIndex]

    const isPastDate =
      checkDate < today &&
      !(
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
      )

    const isFutureDate =
      checkDate > today &&
      !(
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
      )

    if (!(isAdmin || isTeamLeader) && isPastDate) {
      return
    }

    if (!isAdmin && isFutureDate) {
      return
    }

    const team = teamsState.find((t) => t.id === teamId)
    if (!team) return

    const member = team.members.find((m) => m.id === userId)
    if (!member) return

    const newChecked = !member.dailyChecks[dayIndex]

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          date: weekdayDates[dayIndex].toISOString(),
          completed: newChecked,
        }),
      })

      setTeamsState((prevTeams) =>
        prevTeams.map((team) => {
          if (team.id === teamId) {
            return {
              ...team,
              members: team.members.map((member) => {
                if (member.id === userId) {
                  const newDailyChecks = [...member.dailyChecks]
                  newDailyChecks[dayIndex] = newChecked
                  const checkedDays = newDailyChecks.filter((check) => check).length
                  const newProgress = Math.round((checkedDays / 45) * 100)
                  return {
                    ...member,
                    dailyChecks: newDailyChecks,
                    progress: newProgress > 100 ? 100 : newProgress,
                  }
                }
                return member
              }),
            }
          }
          return team
        }),
      )
    } catch (error) {
      console.error("진행 상황 업데이트 실패:", error)
      alert("진행 상황을 업데이트하는 중 오류가 발생했습니다.")
    }
  }

  // 로그인 처리
  const handleLogin = (user: UserData) => {
    setLoggedInUser(user)
    
    // Dev Team인 경우를 포함하여 처리
    const team = teamsState.find((t) => t.id === user.teamId)
    if (team) {
      // 대시보드에 표시되는 팀인 경우
      const member = team.members.find((m) => m.id === user.id)
      if (member) {
        setCurrentUser(member)
      } else {
        // 멤버 정보가 없는 경우 - 기본 정보로 설정
        setCurrentUser({
          id: user.id,
          name: user.name,
          avatar: user.avatar || "/placeholder.svg?height=32&width=32",
          progress: 0,
          goal: 100,
          dailyChecks: Array(45).fill(false),
          role: user.role,
        })
      }
      setActiveTeam(user.teamId)
    } else {
      // Dev Team 등 대시보드에 표시되지 않는 팀의 사용자
      setCurrentUser({
        id: user.id,
        name: user.name,
        avatar: user.avatar || "/placeholder.svg?height=32&width=32",
        progress: 0,
        goal: 100,
        dailyChecks: Array(45).fill(false),
        role: user.role,
      })
      // 첫 번째 표시 가능한 팀으로 설정
      if (teamsState.length > 0) {
        setActiveTeam(teamsState[0].id)
      }
    }
  }

  // 로그아웃 처리
  const handleLogout = () => {
    setLoggedInUser(null)
    setCurrentUser(null)
  }

  // 채팅 토글
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  // 프로필 업데이트 처리
  const handleUpdateProfile = async (updatedUser: UserData) => {
    try {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "프로필 업데이트 실패")
      }

      const userData = await response.json()
      setLoggedInUser(userData)

      if (loggedInUser && updatedUser.teamId !== loggedInUser.teamId) {
        const teamsResponse = await fetch("/api/teams")
        const teamsData = await teamsResponse.json()
        // "Dev Team" 필터링
        const filteredTeams = teamsData.filter((team: any) => team.name !== "Dev Team")
        setTeamsState(filteredTeams)
        setActiveTeam(updatedUser.teamId)
      } else {
        setTeamsState((prevTeams) => {
          return prevTeams.map((team) => {
            if (team.id === updatedUser.teamId) {
              return {
                ...team,
                members: team.members.map((m) =>
                  m.id === updatedUser.id ? { ...m, name: updatedUser.name, avatar: updatedUser.avatar } : m,
                ),
              }
            }
            return team
          })
        })
      }
    } catch (error) {
      console.error("프로필 업데이트 실패:", error)
      alert("프로필 업데이트에 실패했습니다.")
    }
  }

  // 메시지 전송 처리
  const sendingRef = useRef(false)

  const sendMessage = async () => {
    // 로그인 되어 있지만 currentUser가 없는 경우(Dev Team 등)에도 메시지를 보낼 수 있도록 수정
    if (newMessage.trim() === "" || !loggedInUser || sendingRef.current) return;
    sendingRef.current = true; // 중복 방지

    try {
      // currentUser가 없는 경우(Dev Team 등) loggedInUser 정보 사용
      const userId = currentUser?.id || loggedInUser.id;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "메시지 전송 실패");
      }

      const messageData = await response.json();

      const newChatMessage = {
        id: messageData.id,
        userId: userId,
        userName: loggedInUser.name, // 항상 loggedInUser의 이름 사용
        userAvatar: loggedInUser.avatar || "/placeholder.svg?height=40&width=40", // 항상 loggedInUser의 아바타 사용
        message: newMessage,
        timestamp: new Date(messageData.timestamp),
      };

      setChatMessages((prev) => [...prev, newChatMessage]);
      setNewMessage(""); // 입력 필드 초기화
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      sendingRef.current = false; // 플래그 초기화
    }
  };

  // Enter 키로 메시지 전송 처리하는 함수
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 채팅 스크롤 처리
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // 트랙 내부 영역
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 트랙 영역 요소 선택
      const trackElements = document.querySelectorAll('[data-track-area="true"]');
      let isInsideTrack = false;
      
      trackElements.forEach(element => {
        if (element.contains(e.target as Node)) {
          isInsideTrack = true;
        }
      });
      
      if (!isInsideTrack) {
        setSelectedMember(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 사용자 계정 정보 변경 감지 후 채팅 메시지 업데이트
  useEffect(() => {
    if (!loggedInUser) return;

    setChatMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.userId === loggedInUser.id
          ? { ...msg, userName: loggedInUser.name, userAvatar: loggedInUser.avatar }
          : msg
      )
    );
  }, [loggedInUser]);

  // 자정 초기화 처리
  // 채팅 메시지 최신 상태를 유지하는 ref
  const chatMessagesRef = useRef(chatMessages);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  const isMessageFromToday = (timestamp: Date) => {
    const today = new Date()
    return (
      timestamp.getDate() === today.getDate() &&
      timestamp.getMonth() === today.getMonth() &&
      timestamp.getFullYear() === today.getFullYear()
    )
  }

  const currentTeam =
    teamsState.find((team) => team.id === activeTeam) || (teamsState.length > 0 ? teamsState[0] : null)

  const calculateTeamProgress = (team: Team) => {
    if (team.members.length === 0) return 0
    const totalProgress = team.members.reduce((sum, member) => sum + member.progress, 0)
    return Math.round(totalProgress / team.members.length)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, teamId: string) => {
    if (!trackRefs.current[teamId]) return;
    
    setIsDragging(true);
    setStartX(e.pageX - trackRefs.current[teamId]!.offsetLeft);
    setScrollLeft(trackRefs.current[teamId]!.scrollLeft);
    
    // 드래그 중 커서 스타일 변경
    document.body.style.cursor = 'grabbing';
  };
  
  // 트랙 드래그 중 핸들러
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, teamId: string) => {
    if (!isDragging || !trackRefs.current[teamId]) return;
    
    const x = e.pageX - trackRefs.current[teamId]!.offsetLeft;
    const walk = (x - startX) * 2; // 드래그 감도 조정
    trackRefs.current[teamId]!.scrollLeft = scrollLeft - walk;
    
    e.preventDefault();
  };
  
  // 트랙 드래그 종료 핸들러
  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };
  
  // 트랙 마우스 이탈 핸들러
  const handleMouseLeave = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };
  
  // 레이싱 트랙 위치 계산 함수 수정
  const calculateRacePosition = (progress: number) => {
    // 진행도에 따라 0%는 왼쪽 경계(0%)에, 100%는 오른쪽 경계(100%)에 위치하도록 조정
    return Math.min(Math.max(progress, 0), 100); // 0-100% 범위로 제한
  }

  const setTrackRef = (element: HTMLDivElement | null, teamId: string) => {
    trackRefs.current[teamId] = element;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800 p-3 md:p-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <BookOpen className="h-7 w-7 md:h-9 md:w-9 text-primary" />
          <h1 className="text-l md:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent truncate">
            YOUTH1 <br></br>READING CREW
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {loggedInUser?.role === "admin" && (
            <AdminPanel
              teams={teamsState}
              onUpdateTeams={setTeamsState}
              isAdmin={loggedInUser?.role === "admin"}
              chatLogs={[...chatLogs, ...chatMessages]}
            />
          )}
          {loggedInUser ? (
            <ProfileDialog
              user={loggedInUser}
              teams={allTeams}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
            />
          ) : (
            <LoginDialog onLogin={handleLogin} teams={allTeams} />
          )}
        </div>
      </div>
    </header>

    <main className="flex flex-1 flex-col md:flex-row container mx-auto my-3 md:my-6 gap-4 md:gap-6 px-2 md:px-4">
        {/* Left side - Team Progress */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <Card className="p-6 shadow-md border-0">
          <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-2 md:w-3 h-8 md:h-10 rounded-full" style={{ backgroundColor: currentTeam?.color || "#3B82F6" }} />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">{currentTeam?.name || "팀"}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    팀원 {currentTeam?.members.length || 0}명 · 평균 진행률{" "}
                    {currentTeam ? calculateTeamProgress(currentTeam) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Trophy className="h-3 w-3 mr-1" />
                  {teamsState
                    .sort((a, b) => calculateTeamProgress(b) - calculateTeamProgress(a))
                    .findIndex((t) => t.id === (currentTeam?.id || "")) + 1}
                  위
                </Badge>
                <Badge
                  className="px-2 md:px-3 py-1 text-xs md:text-sm"
                  style={{ backgroundColor: currentTeam?.color || "#3B82F6", color: "white" }}
                >
                  {currentTeam ? calculateTeamProgress(currentTeam) : 0}% 완료
                </Badge>
              </div>
            </div>

            <Tabs
              defaultValue="track"
              className="w-full"
              onValueChange={(value) => setActiveView(value as "track" | "members")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
                <TabsTrigger value="track" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Car className="h-3 w-3 md:h-4 md:w-4" />
                  레이싱 트랙
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Users className="h-3 w-3 md:h-4 md:w-4" />
                  팀원 현황
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex space-x-1 mb-3 md:mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {teamsState.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setActiveTeam(team.id)}
                  className={`
                    px-2 md:px-4 py-1 md:py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-xs md:text-sm
                    ${
                      activeTeam === team.id
                        ? "bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  <span className="flex items-center gap-1 md:gap-2">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </span>
                </button>
              ))}
            </div>

            {teamsState.map((team) => (
              <div key={team.id} className={team.id === activeTeam ? "block" : "hidden"}>
                {activeView === "track" && (
                <div
                  ref={(el) => setTrackRef(el, team.id)}
                  className="relative w-full mb-8 rounded-xl border border-gray-200 dark:border-gray-700 cursor-grab"
                  style={{
                    height: `${Math.max(380, team.members.length * 70)}px`,  // 레인 길이 조정
                    overflowX: "auto",
                    scrollbarWidth: "none", // Firefox에서 스크롤바 숨기기
                    msOverflowStyle: "none", // IE에서 스크롤바 숨기기
                  }}
                  data-track-area="true"
                  onMouseDown={(e) => handleMouseDown(e, team.id)}
                  onMouseMove={(e) => handleMouseMove(e, team.id)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* WebKit 브라우저(Chrome, Safari 등)에서 스크롤바 숨기기 위한 스타일 */}
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>              
                  <div className="absolute inset-0 bg-gray-800 rounded-lg" style={{ width: "200%" }}>
                    <div className="absolute inset-0 flex flex-col">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-1 border-b border-white/30" />
                      ))}
                    </div>
                    
                    {/* 시작 플래그 */}
                    <div className="absolute top-0 left-0 h-full w-[10px] bg-white flex items-center justify-center z-10"></div>
                    
                    {/* 중간 선 */}
                    <div className="absolute top-0 left-1/2 h-full w-[10px] bg-yellow-500 flex items-center justify-center z-10 transform -translate-x-1/2">
                      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    </div>
                    
                    {/* 종료 플래그 */}
                    <div className="absolute top-0 right-0 h-full w-[10px] bg-white flex items-center justify-center z-10" style={{ right: "0" }}></div>
                    
                    {/* 시작 체크무늬 */}
                    <div className="absolute top-0 left-0 h-full w-[10px] flex flex-col z-20">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-white" : "bg-black"}`} />
                      ))}
                    </div>
                    
                    {/* 종료 체크무늬 */}
                    <div className="absolute top-0 right-0 h-full w-[10px] flex flex-col z-20" style={{ right: "0" }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-white" : "bg-black"}`} />
                      ))}
                    </div>
                  </div>

                  {/* 팀원 아바타 */}
                  {team.members.map((member, index) => {
                    const position = calculateRacePosition(member.progress);
                    const today = new Date();
                    const todayIndex = weekdayDates.findIndex(
                      (date) =>
                        date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear()
                    );
                    const checkedToday = todayIndex !== -1 && member.dailyChecks[todayIndex];
                    
                    // 모든 팀원이 각자 고유한 레인을 가지도록 수정
                    const totalMembers = team.members.length;
                    const lanePosition = (index + 0.5) * (100 / totalMembers); // 각 팀원이 고유한 레인에 위치하도록 변경
                    const isSelected = selectedMember === member.id;

                    return (
                      <div
                        key={member.id}
                        className="absolute transform -translate-y-1/2 transition-all duration-1000 ease-in-out z-30"
                        style={{
                          left: `${position}%`,
                          top: `${lanePosition}%`,
                        }}
                      >
                        <div className="relative">
                        <Avatar 
                          className={`h-10 w-10 md:h-14 md:w-14 border-2 border-white shadow-lg ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''} cursor-pointer transition-all duration-300`} 
                          onClick={() => setSelectedMember(isSelected ? null : member.id)}
                        >
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback style={{ backgroundColor: team.color }}>
                            {member.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {checkedToday && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border border-white flex items-center justify-center z-20">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-1.5 w-1.5 md:h-2.5 md:w-2.5 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* 선택된 경우에만 이름 표시 (크기 증가) */}
                      {isSelected && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 md:mt-3 bg-white dark:bg-gray-800 p-1.5 md:p-2.5 rounded-md shadow-lg text-xs md:text-sm whitespace-nowrap z-40 min-w-[90px] md:min-w-[120px] text-center border border-gray-200 dark:border-gray-700">
                            <div className="font-bold text-sm md:text-base">{member.name}</div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

                {activeView === "members" && (
                  <div className="space-y-4">
                    {team.members.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-2 text-lg font-semibold">팀원이 없습니다</h3>
                        <p className="text-sm text-muted-foreground">새로운 팀원을 추가해보세요!</p>
                      </div>
                    )}

                    {team.members.map((member) => {
                      const isAdmin = loggedInUser?.role === "admin"
                      const isTeamLeader = loggedInUser?.role === "leader" && loggedInUser?.teamId === team.id
                      const isOwnProfile = loggedInUser?.id === member.id
                      const showCalendar = isAdmin || isTeamLeader || isOwnProfile

                      const today = new Date()
                      const todayIndex = weekdayDates.findIndex(
                        (date) =>
                          date.getDate() === today.getDate() &&
                          date.getMonth() === today.getMonth() &&
                          date.getFullYear() === today.getFullYear(),
                      )
                      const checkedToday = todayIndex !== -1 && member.dailyChecks[todayIndex]

                      return (
                        <Card key={member.id} className="p-3 md:p-6 shadow-sm border-0 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                            <div className="relative">
                              <Avatar
                                className={`h-14 w-14 md:h-14 md:w-14 ${checkedToday ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
                              >
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="text-base md:text-lg">{member.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              {checkedToday && (
                                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center z-20">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-2 w-2 md:h-3 md:w-3 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                                <h3 className="text-lg md:text-xl font-bold">{member.name}</h3>
                                {member.role && (
                                  <Badge
                                    variant={
                                      member.role === "admin"
                                        ? "default"
                                        : member.role === "leader"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-[10px] md:text-xs"
                                  >
                                    {member.role === "admin" ? "관리자" : member.role === "leader" ? "팀장" : "일반"}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs md:text-sm text-muted-foreground">진행률</span>
                                  <span className="text-xs md:text-sm font-medium">{member.progress}%</span>
                                </div>
                                <Progress value={member.progress} className="h-1.5 md:h-2" />
                              </div>
                            </div>
                          </div>
                          {/* 여기에 ProgressCalendar 추가 */}
                        {showCalendar && (
                          <div className="mt-3 md:mt-4">
                            <ProgressCalendar
                              dailyChecks={member.dailyChecks}
                              weekdayDates={weekdayDates}
                              onCheckChange={(index) => handleCheckboxChange(team.id, member.id, index)}
                              canModify={
                                !!loggedInUser &&
                                (loggedInUser.role === "admin" ||
                                  (loggedInUser.role === "leader" && loggedInUser.teamId === team.id) ||
                                  loggedInUser.id === member.id)
                              }
                              isAdmin={loggedInUser?.role === "admin"}
                            />
                          </div>
                        )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* Right side - Chat */}
        <div className="w-full md:w-1/3 flex flex-col md:block hidden">
          <div className="sticky top-[calc(50vh-250px)]"> {/* 스크롤에 따라 화면 중앙에 유지되도록 sticky 포지션 적용 */}
            <Card className="p-6 shadow-md border-0 flex flex-col h-[700px]"> {/* 고정된 높이 설정 */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">CREW CHAT</h2>
              </div>

              <Alert className="mb-4 bg-primary/10 border-primary/20 text-primary">
                <Megaphone className="h-4 w-4" />
                <AlertDescription className="text-xs">채팅은 수정/삭제 불가합니다. 모두 바른말 고운말:)<br></br>오늘 날짜의 채팅만 표시됩니다.</AlertDescription>
              </Alert>

              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {chatMessages.filter(message => isMessageFromToday(message.timestamp)).map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-1.5 md:gap-2 ${message.userId === loggedInUser?.id ? "justify-end" : "justify-start"}`}
                    >
                      {message.userId !== loggedInUser?.id && (
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={message.userAvatar} alt={message.userName} />
                          <AvatarFallback>{message.userName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[75%] ${
                          message.userId === loggedInUser?.id
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                            : "bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none"
                        } p-2 md:p-3 text-xs md:text-sm`}
                      >
                        {message.userId !== loggedInUser?.id && (
                          <p className="text-[10px] md:text-xs font-medium mb-0.5 md:mb-1">{message.userName}</p>
                        )}
                        <p className="break-words">{message.message}</p>
                        <p className="text-[10px] md:text-xs opacity-70 text-right mt-0.5 md:mt-1">{formatTime(message.timestamp)}</p>
                      </div>
                      {message.userId === loggedInUser?.id && (
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={message.userAvatar} alt={message.userName} />
                          <AvatarFallback>{message.userName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 mt-4 border-t">
                {loggedInUser ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="메시지를 입력하세요..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-primary"
                    />
                    <Button 
                      size="icon" 
                      className="rounded-full" 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingRef.current}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">채팅을 이용하려면 로그인이 필요합니다.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="로그인"]')?.click()}
                    >
                      로그인하기
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="md:hidden block">
          <Button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          {isChatOpen && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col">
              <div className="bg-background p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <h2 className="text-xl font-semibold"> CREW CHAT</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleChat}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-x"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
              <Alert className="rounded-none border-b bg-muted/50">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">채팅은 수정/삭제 불가합니다. 모두 바른말 고운말:)<br></br>오늘 날짜의 채팅만 표시됩니다.</AlertDescription>
                </Alert>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {chatMessages.filter(message => isMessageFromToday(message.timestamp)).map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${message.userId === loggedInUser?.id ? "justify-end" : "justify-start"}`}
                      >
                        {message.userId !== loggedInUser?.id && (
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback>{message.userName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] ${
                            message.userId === loggedInUser?.id
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                              : "bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none"
                          } p-3`}
                        >
                          {message.userId !== loggedInUser?.id && (
                            <p className="text-xs font-medium mb-1">{message.userName}</p>
                          )}
                          <p>{message.message}</p>
                          <p className="text-xs opacity-70 text-right mt-1">{formatTime(message.timestamp)}</p>
                        </div>
                        {message.userId === loggedInUser?.id && (
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback>{message.userName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  {loggedInUser ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="메시지를 입력하세요..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="rounded-full bg-gray-100 dark:bg-gray-800 border-0"
                      />
                      <Button 
                        size="icon" 
                        className="rounded-full" 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingRef.current}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-2 bg-muted/30 rounded-md">
                      <p className="text-sm text-muted-foreground">채팅을 이용하려면 로그인이 필요합니다.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="로그인"]')?.click()}
                      >
                        로그인하기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t py-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 MDC YOUTH1. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
