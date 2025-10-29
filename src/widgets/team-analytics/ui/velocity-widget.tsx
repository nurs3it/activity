"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabMergeRequests } from "@/shared/hooks"
import { useState, useEffect, useMemo } from "react"
import { TrendingUp, Calendar } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { format, subWeeks, eachWeekOfInterval } from "date-fns"

export function VelocityWidget() {
  const { mergeRequests } = useGitLabMergeRequests()
  const [velocityData, setVelocityData] = useState<Array<{ week: string; merged: number; opened: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const weeks = eachWeekOfInterval({ start: subWeeks(new Date(), 12), end: new Date() })
    const data = weeks.map((week) => {
      const weekEnd = new Date(week)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const merged = mergeRequests.filter(
        (mr) =>
          mr.merged_at &&
          new Date(mr.merged_at) >= week &&
          new Date(mr.merged_at) < weekEnd
      ).length

      const opened = mergeRequests.filter(
        (mr) =>
          new Date(mr.created_at) >= week &&
          new Date(mr.created_at) < weekEnd
      ).length

      return {
        week: format(week, "dd MMM"),
        merged,
        opened,
      }
    })

    setVelocityData(data)
    setLoading(false)
  }, [mergeRequests])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Загрузка velocity...</p>
        </CardContent>
      </Card>
    )
  }

  const totalMerged = mergeRequests.filter((mr) => mr.state === "merged").length
  const avgPerWeek = velocityData.length > 0
    ? Math.round(totalMerged / velocityData.length)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Velocity команды
        </CardTitle>
        <CardDescription>Динамика закрытия MR по неделям</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="text-center border rounded-lg p-3">
            <div className="text-2xl font-bold">{totalMerged}</div>
            <div className="text-xs text-muted-foreground">Всего merged MR</div>
          </div>
          <div className="text-center border rounded-lg p-3">
            <div className="text-2xl font-bold">{avgPerWeek}</div>
            <div className="text-xs text-muted-foreground">Среднее в неделю</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="merged" stroke="#10b981" strokeWidth={2} name="Merged" />
            <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} name="Opened" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
