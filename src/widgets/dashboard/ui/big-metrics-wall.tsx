"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { useBasicStatistics } from "@/shared/hooks/use-statistics"
import { useGitLabPipelines, useGitLabMergeRequests } from "@/shared/hooks"
import { GitMerge, GitCommit, Zap, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react"
import { formatDuration } from "@/shared/lib/date-utils"
import { Skeleton } from "@/shared/ui/skeleton"
import { useMemo } from "react"
import { cn } from "@/shared/lib/utils"

export function BigMetricsWall() {
  const stats = useBasicStatistics("month")
  const { pipelines } = useGitLabPipelines()
  const { mergeRequests } = useGitLabMergeRequests()

  const avgMRTime = useMemo(() => {
    const mergedMRs = mergeRequests.filter((mr) => mr.state === "merged")
    const times = mergedMRs.map((mr) => {
      if (!mr.merged_at) return null
      return (new Date(mr.merged_at).getTime() - new Date(mr.created_at).getTime()) / (1000 * 60 * 60)
    }).filter((t): t is number => t !== null)

    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null
  }, [mergeRequests])

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const activeMetric = {
    icon: Activity,
    label: "Активность",
    value: stats.commits + stats.mergeRequests.opened,
    change: "+12%",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  }

  const metrics = [
    {
      icon: GitCommit,
      label: "Коммитов",
      value: stats.commits.toLocaleString(),
      period: "за месяц",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: GitMerge,
      label: "Merge Requests",
      value: stats.mergeRequests.opened,
      subValue: `${stats.mergeRequests.merged} merged`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      icon: Zap,
      label: "Проектов",
      active: stats.activeProjects,
      total: stats.projectsCount,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    {
      icon: CheckCircle2,
      label: "CI/CD",
      value: `${Math.round(stats.pipelineStats.successRate)}%`,
      subValue: `${stats.pipelineStats.successful}/${stats.pipelineStats.total}`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      progress: stats.pipelineStats.successRate,
    },
    {
      icon: TrendingUp,
      label: "Время MR",
      value: avgMRTime ? formatDuration(avgMRTime) : "—",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      icon: AlertTriangle,
      label: "Проблемы",
      value: pipelines.filter((p) => p.status === "failed").length,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Главная метрика активности */}
      <Card className={cn("border-2", activeMetric.borderColor)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center", activeMetric.bgColor)}>
                <activeMetric.icon className={cn("h-10 w-10", activeMetric.color)} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{activeMetric.label}</div>
                <div className="flex items-baseline gap-3">
                  <span className={cn("text-5xl font-bold", activeMetric.color)}>
                    {activeMetric.value.toLocaleString()}
                  </span>
                  <span className="text-lg text-green-600 font-semibold">{activeMetric.change}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.commits} коммитов + {stats.mergeRequests.opened} MR
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Остальные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className={cn("border-2 hover:shadow-lg transition-all", metric.borderColor)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", metric.bgColor)}>
                    <Icon className={cn("h-6 w-6", metric.color)} />
                  </div>
                  {metric.progress !== undefined && (
                    <div className="text-xs font-semibold text-muted-foreground">
                      {Math.round(metric.progress)}%
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <div className="text-3xl font-bold mb-1">{metric.value}</div>
                  <div className="text-sm font-medium text-foreground">{metric.label}</div>
                  {metric.period && (
                    <div className="text-xs text-muted-foreground mt-0.5">{metric.period}</div>
                  )}
                </div>

                {metric.subValue && (
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    {metric.subValue}
                  </div>
                )}

                {metric.active !== undefined && metric.total !== undefined && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Активных</span>
                      <span className="font-semibold">{metric.active}/{metric.total}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all", metric.bgColor.replace("/10", ""))}
                        style={{
                          width: `${(metric.active / metric.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {metric.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all", metric.bgColor.replace("/10", ""))}
                        style={{
                          width: `${metric.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}