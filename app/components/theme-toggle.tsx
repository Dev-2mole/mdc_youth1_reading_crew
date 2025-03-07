"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 컴포넌트 마운트 시 현재 테마 상태 확인
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      setIsDarkMode(false)
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
      localStorage.setItem("theme", "dark")
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="테마 전환">
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

