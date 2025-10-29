"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabMergeRequests } from "@/shared/hooks"
import { useState, useEffect, useMemo } from "react"
import { Clock, Users } from "lucide-react"
import { formatDuration, calculateMRTime } from "@/shared/lib/date-utils"

interface ReviewStats {
  reviewerCount: number
  avgReviewTime: number | null
  totalReviews: number
}

export function ReviewStatsWidget() {
  const { mergeRequests } = useGitLabMergeRequests()
  const [stats, setStats] = useState<ReviewStats>({
    reviewerCount: 0,
    avgReviewTime: null,
    totalReviews: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mergedMRs = mergeRequests.filter((mr) => mr.state === "merged")
    const reviewerMap = new Map<string, number>()

    mergedMRs.forEach((mr) => {
      // Упрощенная логика: считаем автора как ревьюера (в реальности нужно получать данные о ревьюерах из API)
      const reviewer = mr.author.email
      reviewerMap.set(reviewer, (reviewerMap.get(reviewer) || 0) + 1)
    })

    const mrTimes = mergedMRs.map(calculateMRTime).filter((t): t is number => t !== null)
    const avgReviewTime = mrTimes.length > 0 ? mrTimes.reduce((a, b) => a + b, 0) / mrTimes.length : null

    setStats({
      reviewerCount: reviewerMap.size,
      avgReviewTime,
      totalReviews: mergedMRs.length,
    })
    setLoading(false)
  }, [mergeRequests])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка статистики ревью...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Статистика ревью
        </CardTitle>
        <CardDescription>Метрики по code review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                Ревьюеров
              </div>
              <div className="text-3xl font-bold">{stats.reviewerCount}</div>
            </div>

            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                Среднее время
              </div>
              <div className="text-3xl font-bold">
                {stats.avgReviewTime ? formatDuration(stats.avgReviewTime) : "—"}
              </div>
            </div>
          </div>

          <div className="text-center border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <div className="text-sm text-muted-foreground mt-1">Всего ревью</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
