export type ChallengeCategory =
  | 'basic-motion'
  | 'word-motion'
  | 'line-motion'
  | 'find-motion'
  | 'delete'
  | 'change'
  | 'yank-paste'
  | 'visual-select'
  | 'combined';

export interface UnlockState {
  isUnlocked: boolean;
  unlockedAt: number | null;
  expiresAt: number | null;
  unlockDurationMs: number;
}

export interface UserConfig {
  timeLimitSeconds: number;
  challengeCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  enabledCategories: ChallengeCategory[];
  theme: 'tokyo-night' | 'gruvbox' | 'nord' | 'monokai';
  fontSize: number;
  showLineNumbers: boolean;
  showHints: boolean;
}

export interface CategoryStat {
  attempts: number;
  successes: number;
  averageTimeMs: number;
}

export interface UserStats {
  totalAttempts: number;
  successfulAttempts: number;
  fastestCompletionMs: number | null;
  averageCompletionMs: number;
  totalChallengesCompleted: number;
  streakDays: number;
  lastAttemptDate: string | null;
  categoryStats: Partial<Record<ChallengeCategory, CategoryStat>>;
}

export interface KeymapDefinition {
  mode: 'normal' | 'insert' | 'visual' | 'command' | 'all' | 'operator-pending';
  lhs: string;
  rhs: string;
  isRecursive: boolean;
}

export interface StorageSchema {
  unlock: UnlockState;
  config: UserConfig;
  stats: UserStats;
  keymaps: KeymapDefinition[];
}

export const DEFAULT_UNLOCK_STATE: UnlockState = {
  isUnlocked: false,
  unlockedAt: null,
  expiresAt: null,
  unlockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
};

export const DEFAULT_CONFIG: UserConfig = {
  timeLimitSeconds: 60,
  challengeCount: 5,
  difficulty: 'mixed',
  enabledCategories: [
    'basic-motion',
    'word-motion',
    'line-motion',
    'find-motion',
    'delete',
    'change',
    'yank-paste',
  ],
  theme: 'tokyo-night',
  fontSize: 14,
  showLineNumbers: true,
  showHints: true,
};

export const DEFAULT_STATS: UserStats = {
  totalAttempts: 0,
  successfulAttempts: 0,
  fastestCompletionMs: null,
  averageCompletionMs: 0,
  totalChallengesCompleted: 0,
  streakDays: 0,
  lastAttemptDate: null,
  categoryStats: {},
};
