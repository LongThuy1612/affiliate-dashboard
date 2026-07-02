export const NEW_DATA_HOURS = Number(process.env.NEXT_PUBLIC_NEW_DATA_HOURS ?? '8');

export function isRecentlyUpdated(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < NEW_DATA_HOURS * 3_600_000;
}
