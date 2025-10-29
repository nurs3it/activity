"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { useGitLabPipelines, useGitLabProjects } from "@/shared/hooks"
import { CheckCircle2, XCircle, Clock, Pause, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import Link from "next/link"
import { useMemo } from "react"

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/20 border-green-500",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-500/20 border-red-500",
  },
  running: {
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-500/20 border-blue-500",
  },
  pending: {
    icon: Pause,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/20 border-yellow-500",
  },
  canceled: {
    icon: AlertCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-500/20 border-gray-500",
  },
}

export function PipelineStatusWall() {
  const { pipelines } = useGitLabPipelines()
  const { projects } = useGitLabProjects()

  const recentPipelines = useMemo(() => {
    return pipelines
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [pipelines])

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Pipelines
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentPipelines.map((pipeline) => {
            const project = projects.find((p) => p.id === pipeline.project_id)
            const config = statusConfig[pipeline.status] || statusConfig.pending
            const Icon = config.icon

            return (
              <Link
                key={pipeline.id}
                href={pipeline.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div
                  className={`${config.bgColor} border-2 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <span className={`text-xs font-semibold ${config.color} capitalize`}>
                      {pipeline.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium truncate mb-1" title={project?.name}>
                    {project?.name || `Project ${pipeline.project_id}`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mb-2">
                    {pipeline.ref}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(pipeline.created_at), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
