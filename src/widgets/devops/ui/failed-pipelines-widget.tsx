"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabPipelines, useGitLabProjects } from "@/shared/hooks"
import { useState, useEffect, useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ProjectPipelineCount {
  projectId: number
  projectName: string
  webUrl: string
  failedCount: number
}

export function FailedPipelinesWidget() {
  const { pipelines } = useGitLabPipelines()
  const { projects } = useGitLabProjects()
  const [projectFailures, setProjectFailures] = useState<ProjectPipelineCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const failedPipelines = pipelines.filter((p) => p.status === "failed")
    const projectMap = new Map<number, { name: string; url: string; count: number }>()

    failedPipelines.forEach((pipeline) => {
      const project = projects.find((pr) => pr.id === pipeline.project_id)
      if (project) {
        const existing = projectMap.get(pipeline.project_id) || {
          name: project.name_with_namespace,
          url: project.web_url,
          count: 0,
        }
        existing.count++
        projectMap.set(pipeline.project_id, existing)
      }
    })

    const failures: ProjectPipelineCount[] = Array.from(projectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.name,
        webUrl: data.url,
        failedCount: data.count,
      }))
      .sort((a, b) => b.failedCount - a.failedCount)

    setProjectFailures(failures)
    setLoading(false)
  }, [pipelines, projects])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Проекты с упавшими пайплайнами
        </CardTitle>
        <CardDescription>Топ проектов с наибольшим количеством ошибок</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projectFailures.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет упавших пайплайнов</p>
          ) : (
            projectFailures.map((project, index) => (
              <Link
                key={project.projectId}
                href={project.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">
                      {project.projectName}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-600 shrink-0 ml-2">
                  {project.failedCount}
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
