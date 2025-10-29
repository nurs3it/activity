"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabProjects, useGitLabMergeRequests, useGitLabPipelines } from "@/shared/hooks"
import { Activity, GitCommit, GitMerge, Timer } from "lucide-react"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale/ru"

interface ActivityItem {
  type: "commit" | "mr" | "pipeline"
  message: string
  time: string
}

export function CodePulseWidget() {
  const { projects } = useGitLabProjects()
  const { mergeRequests } = useGitLabMergeRequests()
  const { pipelines } = useGitLabPipelines()
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    const items: ActivityItem[] = []

    mergeRequests.forEach((mr) => {
      items.push({
        type: "mr",
        message: mr.title,
        time: mr.created_at,
      })
    })

    pipelines
      .filter((p) => p.status === "running" || p.status === "success")
      .forEach((pipeline) => {
        items.push({
          type: "pipeline",
          message: `Pipeline ${pipeline.status} на ${pipeline.ref}`,
          time: pipeline.created_at,
        })
      })

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setActivity(items)
  }, [mergeRequests, pipelines])

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4 text-blue-500" />
      case "mr":
        return <GitMerge className="h-4 w-4 text-green-500" />
      case "pipeline":
        return <Timer className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Code Pulse
        </CardTitle>
        <CardDescription>Реалтайм поток активности</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет активности</p>
          ) : (
            activity.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border rounded-lg p-3 hover:bg-accent transition-colors"
              >
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: ru })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
