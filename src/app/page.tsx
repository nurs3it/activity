"use client"

import {
  HealthScoreWidget,
  BigMetricsWall,
  MiniHeatmapWidget,
} from "@/widgets/dashboard"
import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
      router.refresh()
    }, 30000)

    return () => clearInterval(refreshTimer)
  }, [router])

  const timeString = useMemo(() => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [currentTime])

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [currentTime])

  return (
    <main className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">GitLab Dashboard</h1>
            <p className="text-xl text-muted-foreground capitalize">{dateString}</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold tabular-nums">{timeString}</div>
            <div className="text-sm text-muted-foreground mt-1">Real-time</div>
          </div>
        </div>

        {/* Top Row: Health Score + Big Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <HealthScoreWidget />

            {/* Mini Heatmap */}
            <MiniHeatmapWidget />
          </div>
          <div className="lg:col-span-3">
            <BigMetricsWall />
          </div>
        </div>
      </div>
    </main>
  )
}