"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { MetricCard } from "@/shared/ui/metric-card"
import { useBasicStatistics } from "@/shared/hooks/use-statistics"
import { Database, GitBranch, Code, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import { formatDuration } from "@/shared/lib/date-utils"
import { Skeleton } from "@/shared/ui/skeleton"

export function KeyMetricsWidget() {
  const stats = useBasicStatistics("month")

  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Ключевые метрики</h3>
        <p className="text-sm text-muted-foreground">Основная статистика за месяц</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Проектов"
          value={stats.projectsCount}
          description={`Активных: ${stats.activeProjects}`}
          icon={Database}
        />
        <MetricCard
          title="Коммитов"
          value={stats.commits.toLocaleString()}
          icon={Code}
        />
        <MetricCard
          title="Открытых MR"
          value={stats.mergeRequests.opened}
          description={`Merged: ${stats.mergeRequests.merged}`}
          icon={GitBranch}
        />
        <MetricCard
          title="Открытых Issues"
          value={stats.issues.opened}
          description={`Закрытых: ${stats.issues.closed}`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Среднее время MR"
          value={stats.mergeRequests.avgMRTime ? formatDuration(stats.mergeRequests.avgMRTime) : "—"}
          icon={Clock}
        />
        <MetricCard
          title="CI/CD успешность"
          value={`${Math.round(stats.pipelineStats.successRate)}%`}
          description={`${stats.pipelineStats.successful}/${stats.pipelineStats.total} пайплайнов`}
          icon={TrendingUp}
          trend={{
            value: Math.round(stats.pipelineStats.successRate),
            isPositive: stats.pipelineStats.successRate > 80,
          }}
        />
      </div>
    </div>
  )
}
