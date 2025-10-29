import { subDays, subWeeks, subMonths, format, startOfDay, endOfDay, differenceInHours, differenceInDays } from "date-fns"

export function getDateRange(period: "week" | "month" | "all") {
  const now = new Date()
  switch (period) {
    case "week":
      return {
        since: subWeeks(now, 1).toISOString(),
        until: now.toISOString(),
      }
    case "month":
      return {
        since: subMonths(now, 1).toISOString(),
        until: now.toISOString(),
      }
    default:
      return {
        since: subMonths(now, 12).toISOString(),
        until: now.toISOString(),
      }
  }
}

export function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${Math.round(hours)}ч`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  if (remainingHours === 0) {
    return `${days}д`
  }
  return `${days}д ${remainingHours}ч`
}

export function calculateMRTime(mr: { created_at: string; merged_at: string | null }): number | null {
  if (!mr.merged_at) return null
  return differenceInHours(new Date(mr.merged_at), new Date(mr.created_at))
}
