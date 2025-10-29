"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { useGitLabMergeRequests, useGitLabPipelines } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import { useState, useEffect } from "react"
import { GitMerge, GitCommit, Timer, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import { useGitLabProjects } from "@/shared/hooks"

interface ActivityEvent {
  id: string
  type: "commit" | "mr" | "pipeline"
  title: string
  project?: string
  author?: string
  status?: string
  timestamp: string
  url?: string
}

export function RealtimeActivityFeed() {
  const { projects } = useGitLabProjects()
  const { mergeRequests } = useGitLabMergeRequests()
  const { pipelines } = useGitLabPipelines()
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        setLoading(true)
        const events: ActivityEvent[] = []

        // Recent MRs
        mergeRequests.forEach((mr) => {
          const project = projects.find((p) => p.id === mr.project_id)
          events.push({
            id: `mr-${mr.id}`,
            type: "mr",
            title: mr.title,
            project: project?.name,
            author: mr.author.name,
            status: mr.state,
            timestamp: mr.created_at,
            url: mr.web_url,
          })
        })

        // Recent pipelines
        pipelines.forEach((pipeline) => {
          const project = projects.find((p) => p.id === pipeline.project_id)
          events.push({
            id: `pipeline-${pipeline.id}`,
            type: "pipeline",
            title: `Pipeline ${pipeline.status}`,
            project: project?.name,
            status: pipeline.status,
            timestamp: pipeline.created_at,
            url: pipeline.web_url,
          })
        })

        // Sort by timestamp
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setActivities(events)
      } catch (err) {
        console.error("Error fetching activity:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchRecentActivity()
    }
  }, [mergeRequests, pipelines, projects])

  // Auto-refresh is handled by parent components

  const getIcon = (type: ActivityEvent["type"], status?: string) => {
    switch (type) {
      case "mr":
        return <GitMerge className="h-5 w-5 text-blue-500" />
      case "commit":
        return <GitCommit className="h-5 w-5 text-green-500" />
      case "pipeline":
        if (status === "success") return <CheckCircle2 className="h-5 w-5 text-green-500" />
        if (status === "failed") return <XCircle className="h-5 w-5 text-red-500" />
        if (status === "running") return <Timer className="h-5 w-5 text-blue-500 animate-spin" />
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <Card className="border-2 h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Live Activity
          </h3>
          <span className="text-sm text-muted-foreground">
            Updates every 30 sec
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading activity...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No activity</div>
            </div>
          ) : (
            activities.map((activity) => (
              <a
                key={activity.id}
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="mt-1">{getIcon(activity.type, activity.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {activity.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {activity.project && (
                      <span className="truncate max-w-[150px]">{activity.project}</span>
                    )}
                    {activity.author && <span>• {activity.author}</span>}
                    {activity.status && (
                      <span className="capitalize">• {activity.status}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </div>
              </a>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
