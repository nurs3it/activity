"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { Folder, GitBranch, AlertCircle } from "lucide-react"

export function ProjectsStatsWidget() {
  const { projects, loading, error } = useGitLabProjects()

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
          <p className="text-destructive">Ошибка: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const totalStars = projects.reduce((sum, p) => sum + p.star_count, 0)
  const totalForks = projects.reduce((sum, p) => sum + p.forks_count, 0)
  const totalIssues = projects.reduce((sum, p) => sum + p.open_issues_count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Статистика проектов
        </CardTitle>
        <CardDescription>Общая статистика по всем проектам</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{projects.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Folder className="h-4 w-4" />
                Проектов
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalStars}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                ⭐ Звёзд
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalForks}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <GitBranch className="h-4 w-4" />
                Форков
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Открытых issues</span>
              </div>
              <div className="text-2xl font-bold">{totalIssues}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
