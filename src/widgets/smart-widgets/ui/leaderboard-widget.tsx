"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useBasicStatistics } from "@/shared/hooks/use-statistics"
import { Trophy, Medal, Award } from "lucide-react"
import { useState } from "react"

type Period = "week" | "month"

export function LeaderboardWidget() {
  const [period, setPeriod] = useState<Period>("week")
  const stats = useBasicStatistics(period)

  const topContributors = stats.topContributors

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <CardDescription>Топ участников {period === "week" ? "недели" : "месяца"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              period === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              period === "month"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            Месяц
          </button>
        </div>

        <div className="space-y-3">
          {topContributors.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных</p>
          ) : (
            topContributors.map((contributor, index) => (
              <div
                key={contributor.name}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{contributor.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {contributor.commits} коммитов • {contributor.mrs} MR
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
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
