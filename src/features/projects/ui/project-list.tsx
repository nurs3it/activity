"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { gitlabApi, type GitLabProject } from "@/shared/api/gitlab-client"

export function ProjectList() {
  const [projects, setProjects] = useState<GitLabProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const data = await gitlabApi.getProjects({ per_page: 10 })
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки проектов")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка проектов...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Ошибка: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Проекты GitLab</CardTitle>
        <CardDescription>Список проектов из вашего GitLab</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-muted-foreground">Проекты не найдены</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                <h3 className="font-semibold">{project.name_with_namespace}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>⭐ {project.star_count}</span>
                  <span>🍴 {project.forks_count}</span>
                  <span>📋 {project.open_issues_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
