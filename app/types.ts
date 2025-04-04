// app/types.ts 업데이트
export interface UserData {
  id: string;
  password?: string; // 로그인 후에는 password가 필요 없으므로 선택적입니다.
  name: string;
  cohort: string;
  teamId: string;
  avatar: string;
  role?: "admin" | "leader" | "member";
  passwordReset?: boolean; // 비밀번호 초기화 여부
  autoLogin?: boolean; // 자동 로그인 여부
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  goal: number;
  dailyChecks: boolean[];
  role?: "admin" | "leader" | "member";
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: TeamMember[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: Date;
}