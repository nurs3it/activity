"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabPipelines } from "@/shared/hooks"
import { GitBranch } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale/ru"

const statusColors: Record<string, string> = {
  success: "text-green-600",
  failed: "text-red-600",
  running: "text-blue-600",
  pending: "text-yellow-600",
  canceled: "text-gray-600",
}

interface PipelinesWidgetProps {
  projectId?: number
}

export function PipelinesWidget({ projectId }: PipelinesWidgetProps = {}) {
  const { pipelines, loading, error } = useGitLabPipelines(projectId)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка пайплайнов...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Ошибка: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const statusCounts = pipelines.reduce(
    (acc, pipeline) => {
      acc[pipeline.status] = (acc[pipeline.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Pipelines
        </CardTitle>
        <CardDescription>Статусы CI/CD пайплайнов</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center border rounded-lg p-3">
                <div className={`text-2xl font-bold ${statusColors[status] || "text-gray-600"}`}>
                  {count}
                </div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{status}</div>
              </div>
            ))}
          </div>

          {pipelines.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Последние пайплайны:</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="text-sm border rounded p-2 hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pipeline.ref}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${statusColors[pipeline.status] || "text-gray-600"}`}
                      >
                        {pipeline.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true, locale: ru })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
