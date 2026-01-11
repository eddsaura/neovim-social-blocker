import {
  StorageSchema,
  UnlockState,
  UserConfig,
  UserStats,
  DEFAULT_UNLOCK_STATE,
  DEFAULT_CONFIG,
  DEFAULT_STATS,
  KeymapDefinition,
} from './schema';

type StorageKey = keyof StorageSchema;

async function get<K extends StorageKey>(
  key: K
): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

async function set<K extends StorageKey>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function update<K extends StorageKey>(
  key: K,
  updater: (current: StorageSchema[K]) => StorageSchema[K],
  defaultValue: StorageSchema[K]
): Promise<StorageSchema[K]> {
  const current = (await get(key)) ?? defaultValue;
  const updated = updater(current);
  await set(key, updated);
  return updated;
}

// Unlock state management
export async function getUnlockState(): Promise<UnlockState> {
  return (await get('unlock')) ?? DEFAULT_UNLOCK_STATE;
}

export async function unlockTwitter(durationMs?: number): Promise<UnlockState> {
  const now = Date.now();
  const duration = durationMs ?? DEFAULT_UNLOCK_STATE.unlockDurationMs;
  const newState: UnlockState = {
    isUnlocked: true,
    unlockedAt: now,
    expiresAt: now + duration,
    unlockDurationMs: duration,
  };
  await set('unlock', newState);
  return newState;
}

export async function lockTwitter(): Promise<UnlockState> {
  await set('unlock', DEFAULT_UNLOCK_STATE);
  return DEFAULT_UNLOCK_STATE;
}

export async function checkUnlockExpiry(): Promise<boolean> {
  const state = await getUnlockState();
  if (state.isUnlocked && state.expiresAt && Date.now() > state.expiresAt) {
    await lockTwitter();
    return false;
  }
  return state.isUnlocked;
}

// Config management
export async function getConfig(): Promise<UserConfig> {
  return (await get('config')) ?? DEFAULT_CONFIG;
}

export async function updateConfig(
  partial: Partial<UserConfig>
): Promise<UserConfig> {
  return update(
    'config',
    (current) => ({ ...current, ...partial }),
    DEFAULT_CONFIG
  );
}

// Stats management
export async function getStats(): Promise<UserStats> {
  return (await get('stats')) ?? DEFAULT_STATS;
}

export async function recordAttempt(
  success: boolean,
  completionTimeMs: number
): Promise<UserStats> {
  return update(
    'stats',
    (current) => {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = current.lastAttemptDate;
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];

      let streakDays = current.streakDays;
      if (success) {
        if (lastDate === yesterday) {
          streakDays += 1;
        } else if (lastDate !== today) {
          streakDays = 1;
        }
      }

      const newSuccessCount = current.successfulAttempts + (success ? 1 : 0);
      const newAverage = success
        ? (current.averageCompletionMs * current.successfulAttempts +
            completionTimeMs) /
          newSuccessCount
        : current.averageCompletionMs;

      return {
        ...current,
        totalAttempts: current.totalAttempts + 1,
        successfulAttempts: newSuccessCount,
        fastestCompletionMs:
          success && completionTimeMs
            ? Math.min(current.fastestCompletionMs ?? Infinity, completionTimeMs)
            : current.fastestCompletionMs,
        averageCompletionMs: newAverage,
        streakDays,
        lastAttemptDate: today,
      };
    },
    DEFAULT_STATS
  );
}

// Keymaps management
export async function getKeymaps(): Promise<KeymapDefinition[]> {
  return (await get('keymaps')) ?? [];
}

export async function setKeymaps(
  keymaps: KeymapDefinition[]
): Promise<KeymapDefinition[]> {
  await set('keymaps', keymaps);
  return keymaps;
}

export type {
  StorageSchema,
  UnlockState,
  UserConfig,
  UserStats,
  KeymapDefinition,
};

export {
  DEFAULT_CONFIG,
  DEFAULT_STATS,
  DEFAULT_UNLOCK_STATE,
};
