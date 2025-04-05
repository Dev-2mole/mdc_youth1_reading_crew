"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProgressCalendarProps {
  dailyChecks: boolean[]
  weekdayDates: Date[]
  onCheckChange: (index: number) => void
  canModify: boolean
  isAdmin: boolean
}

export function ProgressCalendar({
  dailyChecks,
  weekdayDates,
  onCheckChange,
  canModify,
  isAdmin,
}: ProgressCalendarProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Move function definitions to the top
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 요일 표시 함수
  const getWeekdayLabel = (date: Date) => {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
    return weekdays[date.getDay()]
  }

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`
  }

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number)
    const date = new Date(year, month)
    return date.toLocaleString("default", { month: "long" })
  }

  // 과거 날짜인지 확인하는 함수 추가
  const isPastDate = (date: Date) => {
    const today = new Date()
    return (
      date < today &&
      !(
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    )
  }

  // 미래 날짜인지 확인하는 함수 추가
  const isFutureDate = (date: Date) => {
    const today = new Date()
    return (
      date > today &&
      !(
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    )
  }

  // 월별 그룹화 로직을 개선합니다
  // 모든 날짜를 먼저 월별로 그룹화합니다
  const allGroupedByMonth: Record<string, { date: Date; index: number; checked: boolean }[]> = {}

  weekdayDates.forEach((date, i) => {
    const monthKey = getMonthKey(date)

    if (!allGroupedByMonth[monthKey]) {
      allGroupedByMonth[monthKey] = []
    }

    allGroupedByMonth[monthKey].push({
      date,
      index: i,
      checked: dailyChecks[i],
    })
  })

  // 월 키 배열을 얻습니다
  const monthKeys = Object.keys(allGroupedByMonth).sort()

  // 현재 표시할 월 키를 결정합니다
  const currentMonthKey = monthKeys[currentPage]

  // 현재 페이지에 표시할 항목들
  const currentItems = currentMonthKey ? allGroupedByMonth[currentMonthKey] : []

  // 총 페이지 수는 월의 수와 같습니다
  const totalPages = monthKeys.length

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  // 완료율 계산 로직도 수정합니다
  const completedCount = currentItems.reduce((count, item) => {
    return count + (item.checked ? 1 : 0)
  }, 0)

  const completionPercentage = currentItems.length > 0 ? Math.round((completedCount / currentItems.length) * 100) : 0

  return (
    <Card className="p-2 md:p-4 shadow-sm border-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">진행 체크 캘린더</h3>
        </div>
        <div className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
          2025.3.10 ~ 2025.5.9 (평일)
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs font-medium">완료: {completionPercentage}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {currentMonthKey && (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b">
              <h4 className="text-sm font-medium">{getMonthName(currentMonthKey)}</h4>
            </div>
            <div className="p-1 sm:p-3 grid grid-cols-5 gap-1 sm:gap-2">
              {/* 요일 헤더 (고정: 월화수목금) */}
              {["월", "화", "수", "목", "금"].map((day) => (
                <div key={day} className="flex justify-center">
                  <span className="text-xs font-bold text-gray-500">{day}</span>
                </div>
              ))}
              
              {/* 현재 월의 날짜들을 요일별로 그룹화하여 표시 */}
              {/* 각 날짜를 실제 요일(월~금)에 따라 적절한 위치에 배치 */}
              {currentItems.map(({ date, index, checked }) => {
                const weekday = date.getDay(); // 0은 일요일, 1은 월요일, ..., 6은 토요일
                // 주말은 표시하지 않음
                if (weekday === 0 || weekday === 6) return null;
                
                // 요일에 맞는 열 위치 계산: 1(월요일)은 0번째 열, 2(화요일)은 1번째 열, ... 5(금요일)은 4번째 열
                const columnIndex = weekday - 1;
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center justify-start pt-1"
                    style={{ gridColumn: columnIndex + 1 }} // 그리드 위치에 명시적으로 배치
                  >
                    <span className="text-xs mb-1 font-medium text-center">{formatDate(date)}</span>
                    <div className="relative">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => onCheckChange(index)}
                                className={`data-[state=checked]:bg-primary h-6 w-6 sm:h-7 sm:w-7 rounded-md transition-all ${
                                  !canModify || (isPastDate(date) && !isAdmin) || (isFutureDate(date) && !isAdmin)
                                    ? "opacity-70 cursor-not-allowed"
                                    : "hover:scale-110"
                                }`}
                                disabled={!canModify || (isFutureDate(date) && !isAdmin)}
                              />
                              {checked && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border border-white"></div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {!canModify && (
                            <TooltipContent className="bg-black/80 text-white text-xs">
                              <p>자신 외 계정은 수정할 수 없습니다.</p>
                            </TooltipContent>
                          )}
                          {isPastDate(date) && !checked && (
                            <TooltipContent className="bg-black/80 text-white text-xs">
                              <p>리더만 과거 날짜를 체크할 수 있습니다.</p>
                            </TooltipContent>
                          )}
                          {isFutureDate(date) && !isAdmin && (
                            <TooltipContent className="bg-black/80 text-white text-xs">
                              <p>미래 날짜는 체크할 수 없습니다.</p>
                            </TooltipContent>
                          )}
                          {isFutureDate(date) && isAdmin && (
                            <TooltipContent className="bg-black/80 text-white text-xs">
                              <p>미래 날짜는 체크할 수 없습니다.</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 md:mt-4 flex justify-between text-xs text-muted-foreground">
        <span>시작일: 2025.3.10</span>
        <span>종료일: 2025.5.9</span>
      </div>
    </Card>
  )
}