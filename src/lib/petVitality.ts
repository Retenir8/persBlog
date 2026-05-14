export const PET_VITALITY_STORAGE_KEY = "persblog-chef-cat-vitals-v1";

export type PetVitality = {
  fullness: number;
  mood: number;
  /** 上次结算饱食/心情或喂食的时间戳（ms） */
  updatedAt: number;
};

const DEFAULT_VITALITY: Omit<PetVitality, "updatedAt"> = {
  fullness: 72,
  mood: 68,
};

/** 每小时下降量（取整，偏慢） */
const DECAY_FULLNESS_PER_HOUR = 2.2;
const DECAY_MOOD_PER_HOUR = 2.8;

export function clampStat(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function persist(v: PetVitality): void {
  try {
    localStorage.setItem(
      PET_VITALITY_STORAGE_KEY,
      JSON.stringify({
        fullness: v.fullness,
        mood: v.mood,
        updatedAt: v.updatedAt,
      }),
    );
  } catch {
    /* 无痕 / 配额 */
  }
}

/** 从上次记录时间到 `now` 结算自然衰减，并写回存储 */
export function loadPetVitality(now = Date.now()): PetVitality {
  if (typeof window === "undefined") {
    return { ...DEFAULT_VITALITY, updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(PET_VITALITY_STORAGE_KEY);
    if (!raw) {
      const first: PetVitality = { ...DEFAULT_VITALITY, updatedAt: now };
      persist(first);
      return first;
    }
    const p = JSON.parse(raw) as Partial<PetVitality>;
    const fullness = clampStat(
      typeof p.fullness === "number" ? p.fullness : DEFAULT_VITALITY.fullness,
    );
    const mood = clampStat(
      typeof p.mood === "number" ? p.mood : DEFAULT_VITALITY.mood,
    );
    const hasValidUpdatedAt =
      typeof p.updatedAt === "number" && p.updatedAt > 0;

    if (!hasValidUpdatedAt) {
      const migrated: PetVitality = { fullness, mood, updatedAt: now };
      persist(migrated);
      return migrated;
    }

    const lastAt = p.updatedAt as number;

    const hours = Math.max(0, (now - lastAt) / 3_600_000);
    const fLoss = Math.floor(hours * DECAY_FULLNESS_PER_HOUR);
    const mLoss = Math.floor(hours * DECAY_MOOD_PER_HOUR);

    if (fLoss === 0 && mLoss === 0) {
      return { fullness, mood, updatedAt: lastAt };
    }

    const next: PetVitality = {
      fullness: clampStat(fullness - fLoss),
      mood: clampStat(mood - mLoss),
      updatedAt: now,
    };
    persist(next);
    return next;
  } catch {
    return { ...DEFAULT_VITALITY, updatedAt: now };
  }
}

export function savePetVitality(v: PetVitality): void {
  persist(v);
}
