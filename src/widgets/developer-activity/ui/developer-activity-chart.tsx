"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabCommit, GitLabMergeRequest } from "@/shared/api/gitlab-client"
import { useState, useEffect, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { User, GitCommit } from "lucide-react"
import { subWeeks } from "date-fns"

interface DeveloperActivity {
  name: string
  commits: number
  mrs: number
}

interface DeveloperActivityChartProps {
  projectId?: number
}

export function DeveloperActivityChart({ projectId }: DeveloperActivityChartProps = {}) {
  const { projects } = useGitLabProjects()
  const [activity, setActivity] = useState<DeveloperActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true)
        const weekAgo = subWeeks(new Date(), 1)
        const contributorMap = new Map<string, { name: string; commits: number; mrs: number }>()

        const projectsToProcess = projectId
          ? projects.filter((p) => p.id === projectId)
          : projects

        // Обрабатываем проекты последовательно небольшими батчами
        const batchSize = 5
        const projectBatches = []
        for (let i = 0; i < projectsToProcess.length; i += batchSize) {
          projectBatches.push(projectsToProcess.slice(i, i + batchSize))
        }

        // Обрабатываем батчи последовательно
        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем коммиты и MR - достаточно по 200 для недельной статистики
              const [commits, mrs] = await Promise.all([
                gitlabApi.getCommits(project.id, {
                  since: weekAgo.toISOString(),
                  per_page: 200,
                }).catch(() => []),
                gitlabApi.getMergeRequests(project.id, {
                  per_page: 200,
                }).catch(() => []),
              ])

              return { commits, mrs }
            } catch (err) {
              console.error(`Error fetching data for project ${project.id}:`, err)
              return { commits: [], mrs: [] }
            }
          })

          const batchResults = await Promise.all(batchPromises)

          batchResults.forEach(({ commits, mrs }, index) => {
            commits.forEach((commit) => {
              const key = commit.author_email
              const existing = contributorMap.get(key) || {
                name: commit.author_name,
                commits: 0,
                mrs: 0,
              }
              existing.commits++
              contributorMap.set(key, existing)
            })

            mrs.forEach((mr) => {
              const key = mr.author.email
              const existing = contributorMap.get(key) || {
                name: mr.author.name,
                commits: 0,
                mrs: 0,
              }
              existing.mrs++
              contributorMap.set(key, existing)
            })
          })
        }

        const activities = Array.from(contributorMap.values())
          .sort((a, b) => b.commits + b.mrs - (a.commits + a.mrs))

        setActivity(activities)
      } catch (err) {
        console.error("Error fetching activity:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchActivity()
    }
  }, [projects, projectId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка графика активности...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Активность разработчиков
        </CardTitle>
        <CardDescription>Коммиты и MR за неделю</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">Нет данных об активности</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="commits" fill="#3b82f6" name="Коммиты" />
              <Bar dataKey="mrs" fill="#10b981" name="MR" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
