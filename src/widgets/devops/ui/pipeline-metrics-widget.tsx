"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabPipelines, useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import { useState, useEffect, useMemo } from "react"
import { Timer, CheckCircle2, XCircle, Clock, TrendingDown } from "lucide-react"
import { formatDuration } from "@/shared/lib/date-utils"
import { subWeeks } from "date-fns"

export function PipelineMetricsWidget() {
  const { pipelines } = useGitLabPipelines()
  const { projects } = useGitLabProjects()
  const [pipelineDetails, setPipelineDetails] = useState<Array<{ duration: number | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPipelineDetails() {
      try {
        setLoading(true)
        const weekAgo = subWeeks(new Date(), 1)
        const recentPipelines = pipelines.filter(
          (p) => new Date(p.created_at) >= weekAgo
        )

        // Обрабатываем все пайплайны для расчета среднего времени
        const details = await Promise.all(
          recentPipelines.map(async (pipeline) => {
            try {
              const detail = await gitlabApi.getPipelineDetail(pipeline.project_id, pipeline.id)
              return { duration: detail.duration }
            } catch (err) {
              return { duration: null }
            }
          })
        )

        setPipelineDetails(details)
      } catch (err) {
        console.error("Error fetching pipeline details:", err)
      } finally {
        setLoading(false)
      }
    }

    if (pipelines.length > 0) {
      fetchPipelineDetails()
    }
  }, [pipelines])

  const stats = useMemo(() => {
    const successful = pipelines.filter((p) => p.status === "success").length
    const failed = pipelines.filter((p) => p.status === "failed").length
    const running = pipelines.filter((p) => p.status === "running").length
    const successRate = pipelines.length > 0 ? (successful / pipelines.length) * 100 : 0

    const durations = pipelineDetails
      .map((d) => d.duration)
      .filter((d): d is number => d !== null && d > 0)
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 60 // в минутах
      : null

    return { successful, failed, running, successRate, avgDuration }
  }, [pipelines, pipelineDetails])

  if (loading && pipelineDetails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка метрик пайплайнов...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          CI/CD Метрики
        </CardTitle>
        <CardDescription>Статистика пайплайнов</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Успешность
              </div>
              <div className="text-3xl font-bold text-green-600">{Math.round(stats.successRate)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.successful} из {pipelines.length}
              </div>
            </div>

            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Среднее время
              </div>
              <div className="text-3xl font-bold">
                {stats.avgDuration ? `${Math.round(stats.avgDuration)}м` : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              <div className="text-xs text-muted-foreground">Успешных</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Упавших</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              <div className="text-xs text-muted-foreground">Запущенных</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
