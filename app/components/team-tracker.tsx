"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

interface TeamMember {
  id: string
  name: string
  avatar: string
  progress: number
}

interface TeamTrackerProps {
  teamName: string
  teamColor: string
  members: TeamMember[]
}

const teamColors = {
  "Red Team": {
    track: "#8B4513",
    border: "#723A0C",
    accent: "#FF4444",
  },
  "Blue Team": {
    track: "#1E3A8A",
    border: "#1E3A5A",
    accent: "#3B82F6",
  },
  "Green Team": {
    track: "#166534",
    border: "#14532D",
    accent: "#22C55E",
  },
  "Yellow Team": {
    track: "#854D0E",
    border: "#713F12",
    accent: "#EAB308",
  },
}

const trackStyles = {
  track: `
    relative 
    h-32 
    rounded-lg 
    mb-6 
    overflow-visible
    border-4
  `,
  lanes: `
    absolute 
    top-0 
    left-0 
    w-full 
    h-full 
    flex 
    flex-col
  `,
  lane: `
    flex-1 
    border-b 
    border-white/30
  `,
  startLine: `
    absolute 
    top-0 
    left-12 
    h-full 
    border-r-2 
    border-dashed 
    border-white/50 
    flex 
    flex-col 
    justify-center 
    items-center 
    w-8
  `,
  finishLine: `
    absolute 
    top-0 
    right-12 
    h-full 
    border-r-2 
    border-dashed 
    border-white/50 
    flex 
    flex-col 
    justify-center 
    items-center 
    w-8
  `,
  character: `
    absolute 
    flex 
    flex-col 
    items-center 
    gap-2 
    transition-all 
    duration-1000 
    ease-in-out
  `,
}

// Calculate the constrained position for characters
const calculatePosition = (progress: number) => {
  // Start at 5% (before start line) and end at 95% (after finish line)
  return progress === 0
    ? 5
    : // At 0%, position before start line
      progress === 100
      ? 95
      : // At 100%, position after finish line
        15 + progress * 0.7 // Normal progress between 15% and 85%
}

export function TeamTracker({ teamName, members }: TeamTrackerProps) {
  const colors = teamColors[teamName as keyof typeof teamColors]

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{teamName}</h3>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.accent }} />
      </div>

      {/* Race Track Visualization */}
      <div
        className={trackStyles.track}
        style={{
          backgroundColor: colors.track,
          borderColor: colors.border,
          height: `${Math.max(120, members.length * 60)}px`,
        }}
      >
        {/* Lane separators */}
        <div className={trackStyles.lanes}>
          {members.map((_, index) => (
            <div key={index} className={trackStyles.lane} />
          ))}
        </div>

        {/* Start line */}
        <div className={trackStyles.startLine}>
          <span className="px-2 text-xs text-white rotate-90" style={{ backgroundColor: colors.track }}>
            시작
          </span>
        </div>

        {/* Finish line */}
        <div className={trackStyles.finishLine}>
          <span className="px-2 text-xs text-white rotate-90" style={{ backgroundColor: colors.track }}>
            목표
          </span>
        </div>

        {/* Characters */}
        {members.map((member, index) => (
          <div
            key={member.id}
            className={trackStyles.character}
            style={{
              top: `${(100 / members.length) * index + 100 / members.length / 2}%`,
              left: `${calculatePosition(member.progress)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Avatar className="border-2 border-white h-8 w-8">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="p-1 rounded text-xs whitespace-nowrap text-white" style={{ backgroundColor: colors.track }}>
              {member.name} ({member.progress}%)
            </div>
          </div>
        ))}
      </div>

      {/* Team Members List */}
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{member.name}</span>
            <div
              className="ml-auto text-xs px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: colors.accent }}
            >
              {member.progress}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

