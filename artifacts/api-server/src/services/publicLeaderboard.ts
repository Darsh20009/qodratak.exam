export function isPublicLeaderboardEntry(entry: {
  userId?: string | number;
  isBot?: boolean;
  isGenerated?: boolean;
}): boolean {
  if (entry.isBot || entry.isGenerated) return false;

  if (typeof entry.userId === 'number') {
    return Number.isSafeInteger(entry.userId) && entry.userId >= 0 && entry.userId < 10000;
  }
  if (typeof entry.userId !== 'string') return false;

  const userId = entry.userId.trim();
  if (!userId || /^(?:gen|bot)(?:_|$)/i.test(userId)) return false;
  if (/^\d+$/.test(userId)) return Number(userId) < 10000;
  return true;
}
