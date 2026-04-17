export interface Session {
  wpm: number;
  xpGained: number;
  textTitle: string;
  module: string;
  duration: number;
  date: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  sessions: Session[];
  isPro?: boolean;
  hearts?: number;
  tecrube?: number;
  avatar?: string;
  friends?: string[];
  unlockedAchievements?: string[];
  usedModules?: string[];
  pathProgress?: string[];
  completedQuests?: string[];
  streakFreeze?: number;
  [key: string]: any;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface ReadingText {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  content: string;
  questions?: QuizQuestion[];
}

export interface Toast {
  id: number;
  msg: string;
  color?: string;
  icon?: string;
}

