"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useBasicStatistics } from "@/shared/hooks/use-statistics"
import { Trophy, GitCommit, GitMerge } from "lucide-react"

export function TopContributorsWidget() {
  const stats = useBasicStatistics("month")

  if (stats.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка участников...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Топ активных участников
        </CardTitle>
        <CardDescription>По коммитам и MR за месяц</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.topContributors.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных об участниках</p>
          ) : (
            stats.topContributors.map((contributor, index) => (
              <div
                key={contributor.name}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contributor.name}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <GitCommit className="h-3 w-3" />
                        {contributor.commits}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitMerge className="h-3 w-3" />
                        {contributor.mrs}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                  {contributor.commits + contributor.mrs}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
