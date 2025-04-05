// app/components/auth/find-password-dialog.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FindPasswordDialogProps {
  onResetSuccess?: (id: string, password: string) => void;
}

export function FindPasswordDialog({ onResetSuccess }: FindPasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: ID/이름 입력, 2: 목사님 정보 입력, 3: 결과
  
  // 폼 상태
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [pastorName, setPastorName] = useState("")
  const [pastorPhone, setPastorPhone] = useState("")
  
  // 결과 상태
  const [error, setError] = useState("")
  const [resetResult, setResetResult] = useState<{id: string, password: string, message: string} | null>(null)
  
  // 폼 초기화
  const resetForm = () => {
    setUserId("")
    setUserName("")
    setPastorName("")
    setPastorPhone("")
    setError("")
    setResetResult(null)
    setStep(1)
  }
  
  // 다이얼로그 닫을 때 폼 초기화
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }
  
  // 전화번호 입력 시 자동으로 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, "")
    
    // 하이픈 추가
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }
  
  // 다음 단계로 이동
  const handleNextStep = () => {
    if (step === 1) {
      if (!userId || !userName) {
        setError("아이디와 이름을 모두 입력해주세요.")
        return
      }
      setError("")
      setStep(2)
    } else if (step === 2) {
      handleResetPassword()
    }
  }
  
  // 비밀번호 초기화 요청
  const handleResetPassword = async () => {
    try {
      setError("")
      
      // 목사님 정보 검증
      if (!pastorName || !pastorPhone) {
        setError("모든 정보를 입력해주세요.")
        return
      }
      
      // 전화번호에서 하이픈 제거
      const cleanPhone = pastorPhone.replace(/-/g, "")
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          name: userName,
          pastorName,
          pastorPhone: cleanPhone,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "비밀번호 초기화 중 오류가 발생했습니다.")
      }
      
      // 성공 시 결과 저장
      setResetResult({
        id: data.id,
        password: data.tempPassword,
        message: data.message
      })
      
      // 3단계로 이동
      setStep(3)
    } catch (error: any) {
      console.error("비밀번호 초기화 오류:", error)
      setError(error.message)
    }
  }
  
  // 완료 처리
  const handleComplete = () => {
    if (resetResult && onResetSuccess) {
      onResetSuccess(resetResult.id, resetResult.password)
    }
    setIsOpen(false)
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-primary">
          아이디/비밀번호 찾기
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>계정 정보 찾기</DialogTitle>
          <DialogDescription>
            {step === 1 && "자신의 아이디와 이름을 입력해주세요."}
            {step === 2 && "청년 1부 인증이 필요합니다.<br> 목동제일교회 청년1부 담당 목사님 정보를 입력해주세요."}
            {step === 3 && "비밀번호 초기화 완료"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-id">아이디</Label>
              <Input 
                id="user-id" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력하세요"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="user-name">이름</Label>
              <Input 
                id="user-name" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pastor-name">이름</Label>
              <div className="flex items-center">
                <Input 
                  id="pastor-name" 
                  value={pastorName} 
                  onChange={(e) => setPastorName(e.target.value)}
                  placeholder="목사님의 이름을 입력하세요"
                  className="flex-1"
                />
                <span className="ml">목사님</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pastor-phone">목사님 전화번호</Label>
              <Input 
                id="pastor-phone" 
                value={pastorPhone} 
                onChange={(e) => setPastorPhone(formatPhoneNumber(e.target.value))}
                placeholder="010-0000-0000"
                maxLength={13}
              />
            </div>
          </div>
        )}

        {step === 3 && resetResult && (
          <div className="py-6">
            <Alert className="mb-4 bg-primary/10 border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">{resetResult.message}</AlertDescription>
            </Alert>
            
            <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
              <div className="grid grid-cols-3 items-center">
                <span className="text-sm font-medium">아이디</span>
                <span className="col-span-2 text-sm font-bold">{resetResult.id}</span>
              </div>
              <div className="grid grid-cols-3 items-center">
                <span className="text-sm font-medium">임시 비밀번호</span>
                <span className="col-span-2 text-sm font-bold font-mono">{resetResult.password}</span>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground">
              임시 비밀번호로 로그인 후, 보안을 위해 반드시 비밀번호를 변경해주세요.
            </p>
          </div>
        )}

        <DialogFooter>
          {step < 3 ? (
            <>
              <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setIsOpen(false)}>
                {step > 1 ? "이전" : "취소"}
              </Button>
              <Button onClick={handleNextStep}>
                {step < 2 ? "다음" : "확인"}
              </Button>
            </>
          ) : (
            <Button onClick={handleComplete}>완료</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}