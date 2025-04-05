// app/components/auth/login-dialog.tsx
"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LogIn, AlertCircle } from "lucide-react"
import { UserData } from "../../types"
import { FindPasswordDialog } from "./find-password-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginDialogProps {
  onLogin: (user: UserData) => void | Promise<void>
  teams: { id: string; name: string }[]
}

export function LoginDialog({ onLogin, teams }: LoginDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("login")

  // 로그인 상태
  const [loginId, setLoginId] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginError, setLoginError] = useState("")

  // 회원가입 상태
  const [registerId, setRegisterId] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerCohort, setRegisterCohort] = useState("")
  const [registerTeam, setRegisterTeam] = useState("")
  const [registerError, setRegisterError] = useState("")

  // 자동 로그인 확인
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const response = await fetch("/api/auth/auto-login", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const user = await response.json();
          onLogin(user);
        }
      } catch (error) {
        console.error("자동 로그인 확인 실패:", error);
      }
    };

    checkAutoLogin();
  }, [onLogin]);

  // 로그인 함수 (API 요청)
  const handleLogin = async () => {
    setLoginError("")

    if (!loginId || !loginPassword) {
      setLoginError("아이디와 비밀번호를 입력해주세요.")
      return
    }

    try {
      const res = await fetch("/api/auth/auto-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: loginId,
          password: loginPassword,
          rememberMe: rememberMe
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "로그인 실패")
      }

      // password 필드를 제거한 후 상태 업데이트
      const { password, ...userWithoutPassword } = data
      onLogin(userWithoutPassword)

      setIsOpen(false)
      resetForms()
    } catch (error: any) {
      console.error("로그인 오류:", error)
      setLoginError(error.message)
    }
  }

  // 회원가입 함수 (API 요청)
  const handleRegister = async () => {
    setRegisterError("")

    if (!registerId || !registerPassword || !registerName || !registerCohort || !registerTeam) {
      setRegisterError("모든 필드를 입력해주세요.")
      return
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registerId,
          password: registerPassword,
          name: registerName,
          cohort: registerCohort,
          teamId: registerTeam,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "회원가입 실패")
      }


      // 회원가입 후 자동 로그인
      const { password, ...userWithoutPassword } = data
      onLogin(userWithoutPassword)

      setIsOpen(false)
      resetForms()
    } catch (error: any) {
      console.error("회원가입 오류:", error)
      setRegisterError(error.message)
    }
  }

  // 폼 초기화 함수
  const resetForms = () => {
    setLoginId("")
    setLoginPassword("")
    setLoginError("")
    setRememberMe(false)
    setRegisterId("")
    setRegisterPassword("")
    setRegisterName("")
    setRegisterCohort("")
    setRegisterTeam("")
    setRegisterError("")
    setActiveTab("login")
  }

  // 비밀번호 찾기 성공 처리
  const handleResetSuccess = (id: string, password: string) => {
    setLoginId(id);
    setLoginPassword(password);
    setActiveTab("login");
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="로그인">
          <LogIn className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>계정</DialogTitle>
          <DialogDescription>로그인하거나 새 계정을 만드세요.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="register">회원가입</TabsTrigger>
          </TabsList>

          {/* 로그인 폼 */}
          <TabsContent value="login">
            <div className="space-y-2">
              {loginError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label>아이디</Label>
                <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" />
              </div>
              <div>
                <Label>비밀번호</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    자동 로그인
                  </label>
                </div>
                <FindPasswordDialog onResetSuccess={handleResetSuccess} />
              </div>
              <Button className="mt-4 w-full" onClick={handleLogin}>로그인</Button>
            </div>
          </TabsContent>

          {/* 회원가입 폼 */}
          <TabsContent value="register">
            <div className="space-y-2">
              {registerError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label>아이디</Label>
                <Input value={registerId} onChange={(e) => setRegisterId(e.target.value)} placeholder="아이디" />
              </div>
              <div>
                <Label>비밀번호</Label>
                <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="비밀번호" />
              </div>
              <div>
                <Label>이름</Label>
                <Input value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="이름" />
              </div>
              <div>
                <Label htmlFor="register-cohort">기수</Label>
                <Select value={registerCohort} onValueChange={setRegisterCohort}>
                  <SelectTrigger id="register-cohort">
                    <SelectValue placeholder="기수를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 41).map((cohort) => (
                      <SelectItem key={cohort} value={cohort.toString()}>
                        {cohort}기
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>팀</Label>
                <Select value={registerTeam} onValueChange={setRegisterTeam}>
                  <SelectTrigger>
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
              <Button className="mt-4 w-full" onClick={handleRegister}>회원가입</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}