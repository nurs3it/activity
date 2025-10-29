"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { useBasicStatistics } from "@/shared/hooks/use-statistics"
import { useGitLabPipelines, useGitLabMergeRequests } from "@/shared/hooks"
import { Heart, TrendingUp, AlertTriangle } from "lucide-react"
import { useMemo } from "react"

export function HealthScoreWidget() {
  const stats = useBasicStatistics("month")
  const { pipelines } = useGitLabPipelines()
  const { mergeRequests } = useGitLabMergeRequests()

  const healthScore = useMemo(() => {
    let score = 100

    // Pipeline success rate penalty
    const pipelineSuccessRate = stats.pipelineStats.successRate
    if (pipelineSuccessRate < 80) score -= 20
    else if (pipelineSuccessRate < 90) score -= 10

    // Open MRs penalty (too many = bottleneck)
    const openMRs = stats.mergeRequests.opened
    if (openMRs > 20) score -= 15
    else if (openMRs > 10) score -= 5

    // Failed pipelines penalty
    const failedPipelines = pipelines.filter((p) => p.status === "failed").length
    if (failedPipelines > 5) score -= 10

    // Old MRs penalty
    const oldMRs = mergeRequests.filter((mr) => {
      const daysSinceCreation = (Date.now() - new Date(mr.created_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreation > 7 && mr.state === "opened"
    }).length
    if (oldMRs > 3) score -= 10

    return Math.max(0, Math.min(100, score))
  }, [stats, pipelines, mergeRequests])

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Отличное"
    if (score >= 60) return "Хорошее"
    return "Требует внимания"
  }

  return (
    <Card className="border-2">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className={`h-8 w-8 ${getHealthColor(healthScore)}`} />
              <span className="text-sm text-muted-foreground uppercase tracking-wide">Health Score</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`text-7xl font-bold ${getHealthColor(healthScore)}`}>
                {Math.round(healthScore)}
              </span>
              <span className="text-3xl text-muted-foreground">/100</span>
            </div>
            <p className={`text-lg font-semibold mt-2 ${getHealthColor(healthScore)}`}>
              {getHealthLabel(healthScore)}
            </p>
          </div>
          <div className="w-48 h-48 relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - healthScore / 100)}`}
                strokeLinecap="round"
                className={getHealthColor(healthScore)}
                style={{
                  transition: "stroke-dashoffset 0.5s ease-in-out",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className={`h-12 w-12 ${getHealthColor(healthScore)}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
