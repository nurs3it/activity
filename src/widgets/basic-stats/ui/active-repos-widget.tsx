"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabCommit } from "@/shared/api/gitlab-client"
import { useState, useEffect, useMemo } from "react"
import { subWeeks } from "date-fns"
import { TrendingUp, Folder } from "lucide-react"
import Link from "next/link"

interface ProjectActivity {
  project: {
    id: number
    name: string
    name_with_namespace: string
    web_url: string
  }
  commitsCount: number
}

export function ActiveReposWidget() {
  const { projects } = useGitLabProjects()
  const [projectActivities, setProjectActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true)
        const activities: ProjectActivity[] = []
        const weekAgo = subWeeks(new Date(), 1)

        // Обрабатываем все проекты батчами
        const batchSize = 10
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем коммиты - достаточно 100 для определения активности
              const commits = await gitlabApi.getCommits(project.id, {
                since: weekAgo.toISOString(),
                per_page: 100,
              }).catch(() => [])

              if (commits.length > 0) {
                return {
                  project: {
                    id: project.id,
                    name: project.name,
                    name_with_namespace: project.name_with_namespace,
                    web_url: project.web_url,
                  },
                  commitsCount: commits.length,
                }
              }
              return null
            } catch (err) {
              console.error(`Error fetching commits for project ${project.id}:`, err)
              return null
            }
          })

          const batchResults = await Promise.all(batchPromises)
          activities.push(...batchResults.filter((a): a is ProjectActivity => a !== null))
        }

        activities.sort((a, b) => b.commitsCount - a.commitsCount)
        setProjectActivities(activities)
      } catch (err) {
        console.error("Error fetching activity:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchActivity()
    }
  }, [projects])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка активных репозиториев...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Самые активные репозитории
        </CardTitle>
        <CardDescription>За последнюю неделю</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projectActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет активных репозиториев</p>
          ) : (
            projectActivities.map((activity, index) => (
              <Link
                key={activity.project.id}
                href={activity.project.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">
                      {activity.project.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {activity.project.name_with_namespace}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary shrink-0 ml-2">
                  {activity.commitsCount}
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
