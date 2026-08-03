/**
 * Shared "don't repeat the last N" picker. Pure function, no storage side
 * effects — callers are responsible for persisting `updatedRecentIds`
 * however suits them (React state, localStorage, etc). Used by both the
 * transit chapter's field-note rotation and the StatsTeaser trivia rotation.
 */
export function pickNoRepeat(
  pool: string[],
  recentIds: string[],
  maxRecent: number
): { value: string; index: number; updatedRecentIds: string[] } {
  if (pool.length === 0) {
    return { value: "", index: -1, updatedRecentIds: recentIds };
  }
  if (pool.length === 1) {
    return { value: pool[0], index: 0, updatedRecentIds: [pool[0]] };
  }

  const recentSet = new Set(recentIds.slice(-maxRecent));
  const candidates = pool
    .map((value, index) => ({ value, index }))
    .filter((c) => !recentSet.has(c.value));

  const pickFrom = candidates.length > 0 ? candidates : pool.map((value, index) => ({ value, index }));
  const choice = pickFrom[Math.floor(Math.random() * pickFrom.length)];

  const updatedRecentIds = [...recentIds, choice.value].slice(-Math.max(maxRecent, 1));

  return { value: choice.value, index: choice.index, updatedRecentIds };
}
