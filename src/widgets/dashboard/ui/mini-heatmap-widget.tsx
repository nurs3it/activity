"use client"

import { useMemo } from "react"
import { useAllCommits } from "@/shared/hooks/use-all-commits"
import type { GitLabCommit } from "@/shared/api/gitlab-client"
import { format, startOfWeek, subDays, isToday, addDays } from "date-fns"
import { Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"

interface DayCommits {
  date: Date
  count: number
}

export function MiniHeatmapWidget() {
  const { allCommits, loading } = useAllCommits()

  const weekData = useMemo(() => {
    const weekAgo = subDays(new Date(), 7)
    const today = new Date()
    const dayCommitsMap = new Map<string, number>()

    // Преобразуем Map в массив коммитов с projectId
    const commitsArray: (GitLabCommit & { projectId: number })[] = []
    allCommits.forEach((commits, projectId) => {
      commits.forEach((commit) => {
        commitsArray.push({ ...commit, projectId })
      })
    })

    commitsArray.forEach((commit) => {
      const commitDate = new Date(commit.committed_date)
      if (commitDate >= weekAgo && commitDate <= today) {
        const dateKey = format(commitDate, "yyyy-MM-dd")
        dayCommitsMap.set(dateKey, (dayCommitsMap.get(dateKey) || 0) + 1)
      }
    })

    // Заполняем все дни недели
    const days: DayCommits[] = []
    let currentDate = startOfWeek(today, { weekStartsOn: 1 }) // Понедельник
    for (let i = 0; i < 7; i++) {
      const dateKey = format(currentDate, "yyyy-MM-dd")
      days.push({
        date: currentDate,
        count: dayCommitsMap.get(dateKey) || 0,
      })
      currentDate = addDays(currentDate, 1)
    }

    return days
  }, [allCommits])

  const maxCount = Math.max(...weekData.map((d) => d.count), 1)
  const totalCommits = weekData.reduce((sum, day) => sum + day.count, 0)

  const getIntensity = (count: number, date: Date) => {
    const isTodayDate = isToday(date)
    if (count === 0) {
      return isTodayDate
        ? "bg-muted border border-blue-400 dark:border-blue-500"
        : "bg-[#ebedf0] dark:bg-[#161b22]"
    }
    const intensity = Math.floor((count / maxCount) * 4)
    const colors = [
      "bg-[#c6e48b] dark:bg-[#0e4429]",
      "bg-[#7bc96f] dark:bg-[#006d32]",
      "bg-[#239a3b] dark:bg-[#26a641]",
      "bg-[#196127] dark:bg-[#39d353]",
    ]
    const baseColor = colors[Math.min(intensity, 3)]
    return isTodayDate
      ? `${baseColor} border border-blue-400 dark:border-blue-500`
      : baseColor
  }

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 hover:border-primary/50 transition-all mt-6">
      <CardContent className="p-4">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Commits Heatmap</h3>
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days: {totalCommits} commits</p>
        </div>

        {/* Heatmap Grid - Compact */}
        <div className="mb-3">
          <div className="flex gap-1.5 justify-between">
            {weekData.map((day, idx) => {
              const isTodayDate = isToday(day.date)
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="text-[10px] text-muted-foreground leading-none">
                    {format(day.date, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "w-full aspect-square rounded-sm transition-all max-w-[24px]",
                      getIntensity(day.count, day.date)
                    )}
                    title={`${format(day.date, "MMM d, yyyy")}: ${day.count} ${day.count === 1 ? "commit" : "commits"}${isTodayDate ? " (Today)" : ""}`}
                  />
                  <div className="text-[10px] text-muted-foreground leading-none h-3">
                    {day.count > 0 ? day.count : ""}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend and Link - Compact */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-center gap-1.5 text-[10px]">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 rounded-sm bg-[#c6e48b] dark:bg-[#0e4429]" />
              <div className="w-2 h-2 rounded-sm bg-[#7bc96f] dark:bg-[#006d32]" />
              <div className="w-2 h-2 rounded-sm bg-[#239a3b] dark:bg-[#26a641]" />
              <div className="w-2 h-2 rounded-sm bg-[#196127] dark:bg-[#39d353]" />
            </div>
            <span className="text-muted-foreground">More</span>
          </div>

          <Link href="/commits-heatmap" className="block">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-7">
              View Full Year
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

