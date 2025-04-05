// app/components/auth/change-password-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserData } from "../../types"

interface ChangePasswordDialogProps {
  user: UserData;
  onPasswordChanged: () => void;
}

export function ChangePasswordDialog({ user, onPasswordChanged }: ChangePasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // 비밀번호 초기화 상태인 경우 자동으로 다이얼로그 표시
  useEffect(() => {
    if (user && user.passwordReset) {
      setIsOpen(true)
    }
  }, [user])

  // 폼 초기화
  const resetForm = () => {
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccess(false)
  }
  
  // 다이얼로그 닫을 때 폼 초기화
  const handleOpenChange = (open: boolean) => {
    // 비밀번호 초기화 상태에서는 닫기 방지
    if (!open && user?.passwordReset) {
      return
    }

    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }
  
  // 비밀번호 변경 요청
  const handleChangePassword = async () => {
    try {
      setError("")
      
      // 입력 검증
      if (!newPassword || !confirmPassword) {
        setError("새 비밀번호를 입력해주세요.")
        return
      }
      
      if (newPassword !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.")
        return
      }
      
      if (newPassword.length < 6) {
        setError("비밀번호는 최소 6자 이상이어야 합니다.")
        return
      }
      
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "비밀번호 변경 중 오류가 발생했습니다.")
      }
      
      // 성공 상태로 변경
      setSuccess(true)
      
      // 3초 후 다이얼로그 닫기
      setTimeout(() => {
        setIsOpen(false)
        resetForm()
        onPasswordChanged()
      }, 3000)

    } catch (error: any) {
      console.error("비밀번호 변경 오류:", error)
      setError(error.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!user?.passwordReset && (
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          비밀번호 변경
        </Button>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
          <DialogDescription>
            {user?.passwordReset
              ? "비밀번호가 초기화되었습니다. 새로운 비밀번호를 설정해주세요."
              : "새로운 비밀번호를 입력해주세요."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>비밀번호가 성공적으로 변경되었습니다.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input 
              id="new-password" 
              type="password"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <Input 
              id="confirm-password" 
              type="password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 확인"
            />
          </div>
        </div>

        <DialogFooter>
          {!user?.passwordReset && (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              취소
            </Button>
          )}
          <Button onClick={handleChangePassword} disabled={success}>
            변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}