"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabIssue } from "@/shared/api/gitlab-client"
import { useState, useEffect, useMemo } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { differenceInDays } from "date-fns"

interface AgingIssue {
  id: number
  title: string
  web_url: string
  age: number
}

export function IssueAgingWidget() {
  const { projects } = useGitLabProjects()
  const [issues, setIssues] = useState<AgingIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true)
        const allIssues: AgingIssue[] = []

        // Обрабатываем все проекты батчами
        const batchSize = 10
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем issues - достаточно 200
              const projectIssues = await gitlabApi.getIssues(project.id, {
                state: "opened",
                per_page: 200,
              }).catch(() => [])

              return projectIssues
                .map((issue) => {
                  const age = differenceInDays(new Date(), new Date(issue.created_at))
                  if (age > 7) {
                    return {
                      id: issue.id,
                      title: issue.title,
                      web_url: issue.web_url,
                      age,
                    }
                  }
                  return null
                })
                .filter((issue): issue is AgingIssue => issue !== null)
            } catch (err) {
              console.error(`Error fetching issues for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allIssues.push(...batchResults.flat())
        }

        allIssues.sort((a, b) => b.age - a.age)
        setIssues(allIssues)
      } catch (err) {
        console.error("Error fetching issues:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchIssues()
    }
  }, [projects])

  const stats = useMemo(() => {
    const old = issues.filter((i) => i.age > 30).length
    const veryOld = issues.filter((i) => i.age > 90).length
    const avgAge = issues.length > 0
      ? Math.round(issues.reduce((sum, i) => sum + i.age, 0) / issues.length)
      : 0

    return { old, veryOld, avgAge }
  }, [issues])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка старых issues...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Старые Issues
        </CardTitle>
        <CardDescription>Issues без активности более 7 дней</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="text-center border rounded-lg p-2">
            <div className="text-xl font-bold">{stats.avgAge}</div>
            <div className="text-xs text-muted-foreground">Средний возраст</div>
          </div>
          <div className="text-center border rounded-lg p-2">
            <div className="text-xl font-bold text-yellow-600">{stats.old}</div>
            <div className="text-xs text-muted-foreground">&gt;30 дней</div>
          </div>
          <div className="text-center border rounded-lg p-2">
            <div className="text-xl font-bold text-red-600">{stats.veryOld}</div>
            <div className="text-xs text-muted-foreground">&gt;90 дней</div>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет старых issues</p>
          ) : (
            issues.map((issue) => (
              <a
                key={issue.id}
                href={issue.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border rounded-lg p-2 hover:bg-accent transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {issue.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {issue.age} дней
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
