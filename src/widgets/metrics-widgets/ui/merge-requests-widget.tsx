"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabMergeRequests } from "@/shared/hooks"
import { GitBranch, CheckCircle2, Clock, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale/ru"

interface MergeRequestsWidgetProps {
  projectId?: number
}

export function MergeRequestsWidget({ projectId }: MergeRequestsWidgetProps = {}) {
  const { mergeRequests, loading, error } = useGitLabMergeRequests(projectId)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка MR...</p>
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

  const merged = mergeRequests.filter((mr) => mr.state === "merged").length
  const opened = mergeRequests.filter((mr) => mr.state === "opened").length
  const closed = mergeRequests.filter((mr) => mr.state === "closed").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Merge Requests
        </CardTitle>
        <CardDescription>Статистика по merge requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{merged}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="h-4 w-4" />
              Merged
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{opened}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Clock className="h-4 w-4" />
              Opened
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{closed}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <XCircle className="h-4 w-4" />
              Closed
            </div>
          </div>
        </div>

        {mergeRequests.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold">Последние MR:</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mergeRequests.map((mr) => (
                <div key={mr.id} className="text-sm border rounded p-2 hover:bg-accent transition-colors">
                  <div className="font-medium line-clamp-1">{mr.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mr.author.name} • {formatDistanceToNow(new Date(mr.created_at), { addSuffix: true, locale: ru })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
