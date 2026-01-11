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

export type UnlockDurationMode = 'hardcore' | 'standard' | 'casual';

export const UNLOCK_DURATION_PRESETS: Record<UnlockDurationMode, { label: string; durationMs: number }> = {
  hardcore: { label: 'Hardcore Mode', durationMs: 5 * 60 * 1000 },      // 5 minutes
  standard: { label: 'Standard League', durationMs: 10 * 60 * 1000 },  // 10 minutes
  casual: { label: 'Casual Player', durationMs: 20 * 60 * 1000 },      // 20 minutes
};

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
  unlockDurationMode: UnlockDurationMode;
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
  blockedSites: string[];
}

export const DEFAULT_BLOCKED_SITES: string[] = [
  'twitter.com',
  'x.com',
];

export const DEFAULT_UNLOCK_STATE: UnlockState = {
  isUnlocked: false,
  unlockedAt: null,
  expiresAt: null,
  unlockDurationMs: UNLOCK_DURATION_PRESETS.casual.durationMs, // Uses config setting
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
  unlockDurationMode: 'casual',
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
