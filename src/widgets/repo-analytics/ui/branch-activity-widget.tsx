"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabCommit } from "@/shared/api/gitlab-client"
import { useState, useEffect } from "react"
import { GitBranch, Activity } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface BranchActivity {
  branchName: string
  commits: number
}

interface BranchActivityWidgetProps {
  projectId?: number
}

export function BranchActivityWidget({ projectId }: BranchActivityWidgetProps = {}) {
  const { projects } = useGitLabProjects()
  const [branchData, setBranchData] = useState<BranchActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBranchActivity() {
      try {
        setLoading(true)
        const branchMap = new Map<string, number>()

        const projectsToProcess = projectId
          ? projects.filter((p) => p.id === projectId)
          : projects

        // Обрабатываем все проекты батчами
        const batchSize = 10
        const projectBatches = []
        for (let i = 0; i < projectsToProcess.length; i += batchSize) {
          projectBatches.push(projectsToProcess.slice(i, i + batchSize))
        }

        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем данные - достаточно по 200
              const [branches, commits] = await Promise.all([
                gitlabApi.getBranches(project.id, { per_page: 200 }).catch(() => []),
                gitlabApi.getCommits(project.id, { per_page: 200 }).catch(() => []),
              ])

              commits.forEach((commit) => {
                // Упрощенная логика: считаем ветки по данным коммитов
                const branch = branches.find((b) => b.name === project.default_branch)?.name || "main"
                branchMap.set(branch, (branchMap.get(branch) || 0) + 1)
              })
            } catch (err) {
              console.error(`Error fetching branches for project ${project.id}:`, err)
            }
          })

          await Promise.all(batchPromises)
        }

        const data = Array.from(branchMap.entries())
          .map(([branchName, commits]) => ({ branchName, commits }))
          .sort((a, b) => b.commits - a.commits)

        setBranchData(data)
      } catch (err) {
        console.error("Error fetching branch activity:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchBranchActivity()
    }
  }, [projects, projectId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка активности веток...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Активность веток
        </CardTitle>
        <CardDescription>Распределение коммитов по веткам</CardDescription>
      </CardHeader>
      <CardContent>
        {branchData.length === 0 ? (
          <p className="text-muted-foreground text-sm">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchData}>
              <XAxis dataKey="branchName" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="commits" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
