"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabProject } from "@/shared/api/gitlab-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { ArrowLeft, ExternalLink, GitBranch, Star, GitFork, AlertCircle } from "lucide-react"
import Link from "next/link"
import { MergeRequestsWidget, PipelinesWidget } from "@/widgets/metrics-widgets"
import { DeveloperActivityChart } from "@/widgets/developer-activity"
import { BranchActivityWidget } from "@/widgets/repo-analytics"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.id)
  const [project, setProject] = useState<GitLabProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const data = await gitlabApi.getProject(projectId)
        setProject(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки проекта")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Загрузка проекта...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive mb-4">Ошибка: {error || "Проект не найден"}</p>
              <Button onClick={() => router.push("/projects")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к списку
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к проектам
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground mb-4">{project.name_with_namespace}</p>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-3xl">{project.description}</p>
              )}
            </div>
            <a
              href={project.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Открыть в GitLab
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{project.star_count}</span>
              <span className="text-muted-foreground">звёзд</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GitFork className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">{project.forks_count}</span>
              <span className="text-muted-foreground">форков</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-semibold">{project.open_issues_count}</span>
              <span className="text-muted-foreground">open issues</span>
            </div>
            {project.default_branch && (
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{project.default_branch}</span>
                <span className="text-muted-foreground">ветка</span>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="merge-requests">Merge Requests</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MergeRequestsWidget projectId={projectId} />
              <PipelinesWidget projectId={projectId} />
            </div>
          </TabsContent>

          <TabsContent value="merge-requests" className="space-y-6">
            <MergeRequestsWidget projectId={projectId} />
          </TabsContent>

          <TabsContent value="pipelines" className="space-y-6">
            <PipelinesWidget projectId={projectId} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <BranchActivityWidget projectId={projectId} />
            <div className="mt-6">
              <DeveloperActivityChart projectId={projectId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
