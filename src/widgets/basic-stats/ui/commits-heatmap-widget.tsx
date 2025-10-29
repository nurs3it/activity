"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabCommit } from "@/shared/api/gitlab-client"
import { useState, useEffect, useMemo } from "react"
import { format, startOfWeek, eachDayOfInterval, subWeeks, getDay } from "date-fns"
import { Calendar } from "lucide-react"

interface HeatmapData {
  date: Date
  count: number
}

export function CommitsHeatmapWidget() {
  const { projects } = useGitLabProjects()
  const [commits, setCommits] = useState<{ date: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCommits() {
      try {
        setLoading(true)
        const allCommits: { date: string }[] = []
        const weeksAgo = subWeeks(new Date(), 52)

        // Обрабатываем все проекты батчами
        const batchSize = 10
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем коммиты для heatmap - достаточно 2000 за год
              const projectCommits = await gitlabApi.getCommits(project.id, {
                since: weeksAgo.toISOString(),
                per_page: 2000,
              }).catch(() => [])
              return projectCommits.map((c) => ({ date: c.committed_date }))
            } catch (err) {
              console.error(`Error fetching commits for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allCommits.push(...batchResults.flat())
        }
        setCommits(allCommits)
      } catch (err) {
        console.error("Error fetching commits:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchCommits()
    }
  }, [projects])

  const heatmapData = useMemo(() => {
    const weeksAgo = subWeeks(new Date(), 52)
    const days = eachDayOfInterval({ start: weeksAgo, end: new Date() })
    const commitMap = new Map<string, number>()

    commits.forEach((commit) => {
      const dateKey = format(new Date(commit.date), "yyyy-MM-dd")
      commitMap.set(dateKey, (commitMap.get(dateKey) || 0) + 1)
    })

    return days.map((date) => ({
      date,
      count: commitMap.get(format(date, "yyyy-MM-dd")) || 0,
    }))
  }, [commits])

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1)

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted"
    const intensity = Math.floor((count / maxCount) * 4)
    return [
      "bg-green-100 dark:bg-green-900/30",
      "bg-green-300 dark:bg-green-800/50",
      "bg-green-500 dark:bg-green-700",
      "bg-green-700 dark:bg-green-600",
      "bg-green-900 dark:bg-green-500",
    ][Math.min(intensity, 4)]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading heatmap...</p>
        </CardContent>
      </Card>
    )
  }

  const weeks = Array.from({ length: 53 }, (_, i) => subWeeks(new Date(), 52 - i))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Commits Heatmap
        </CardTitle>
        <CardDescription>Commit activity over the last year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {weeks.map((weekStart, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                  const day = new Date(weekStart)
                  day.setDate(day.getDate() + dayOffset)
                  const dayData = heatmapData.find(
                    (d) => format(d.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  )
                  const count = dayData?.count || 0

                  return (
                    <div
                      key={dayOffset}
                      className={`w-3 h-3 rounded-sm ${getIntensity(count)}`}
                      title={`${format(day, "dd MMM yyyy")}: ${count} commits`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30" />
              <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-700" />
              <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-600" />
              <div className="w-3 h-3 rounded-sm bg-green-900 dark:bg-green-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
