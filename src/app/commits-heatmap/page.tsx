"use client"

import { useState, useMemo } from "react"
import { useAllCommits } from "@/shared/hooks/use-all-commits"
import { useGitLabProjects } from "@/shared/hooks"
import { format, startOfWeek, subWeeks, isToday, isSameDay } from "date-fns"
import { ArrowLeft, Calendar, Search, X, GitCommit, User, Clock, Plus, Minus, Filter } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogContentInner, DialogClose } from "@/shared/ui/dialog"
import type { GitLabCommit } from "@/shared/api/gitlab-client"
import { cn } from "@/shared/lib/utils"

interface DayCommits {
  date: Date
  commits: (GitLabCommit & { projectId: number })[]
  count: number
}

export default function CommitsHeatmapPage() {
  const { allCommits, loading } = useAllCommits()
  const { projects } = useGitLabProjects()
  const [selectedDay, setSelectedDay] = useState<DayCommits | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const heatmapData = useMemo(() => {
    const weeksAgo = subWeeks(new Date(), 52)
    const today = new Date()
    const dayCommitsMap = new Map<string, DayCommits>()

    // Создаем Map для быстрого поиска дней
    const days = []
    const currentDate = new Date(weeksAgo)
    while (currentDate <= today) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Инициализируем все дни
    days.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd")
      dayCommitsMap.set(dateKey, {
        date: day,
        commits: [],
        count: 0,
      })
    })

    // Заполняем коммитами
    allCommits.forEach((commits, projectId) => {
      commits.forEach((commit) => {
        const commitDate = new Date(commit.committed_date)
        const dateKey = format(commitDate, "yyyy-MM-dd")
        const dayData = dayCommitsMap.get(dateKey)
        
        if (dayData && commitDate >= weeksAgo && commitDate <= today) {
          dayData.commits.push({ ...commit, projectId })
          dayData.count++
        }
      })
    })

    return Array.from(dayCommitsMap.values())
  }, [allCommits])

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1)

  const getIntensity = (count: number, date: Date) => {
    const isTodayDate = isToday(date)
    if (count === 0) {
      return isTodayDate
        ? "bg-muted border-2 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/50"
        : "bg-[#ebedf0] dark:bg-[#161b22]"
    }
    const intensity = Math.floor((count / maxCount) * 4)
    const colors = [
      "bg-[#c6e48b] dark:bg-[#0e4429]",
      "bg-[#7bc96f] dark:bg-[#006d32]",
      "bg-[#239a3b] dark:bg-[#26a641]",
      "bg-[#196127] dark:bg-[#39d353]",
    ]
    const baseColor = colors[Math.min(intensity, 3)]
    return isTodayDate
      ? `${baseColor} border-2 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/50`
      : baseColor
  }

  const weeks = Array.from({ length: 53 }, (_, i) => subWeeks(new Date(), 52 - i))
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const selectedDayCommits = selectedDay?.commits || []
  const selectedProject = useMemo(() => {
    if (!selectedDay) return null
    const projectIds = new Set(selectedDayCommits.map((c) => c.projectId))
    return Array.from(projectIds).map((id) => projects.find((p) => p.id === id)).filter(Boolean)
  }, [selectedDay, selectedDayCommits, projects])

  // Фильтруем и ищем коммиты
  const filteredCommits = useMemo(() => {
    let filtered = selectedDayCommits

    // Фильтр по проекту
    if (selectedProjectId) {
      filtered = filtered.filter((c) => c.projectId === selectedProjectId)
    }

    // Поиск по сообщению, автору или ID
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.message.toLowerCase().includes(query) ||
          c.author_name.toLowerCase().includes(query) ||
          c.author_email.toLowerCase().includes(query) ||
          c.short_id.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => new Date(b.committed_date).getTime() - new Date(a.committed_date).getTime())
  }, [selectedDayCommits, searchQuery, selectedProjectId])

  return (
    <main className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Commits Heatmap</h1>
              <p className="text-lg text-muted-foreground">
                Commit activity over the last year
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="text-muted-foreground text-lg">Loading commits...</div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-8 shadow-lg">
            {/* GitLab-style heatmap */}
            <div className="flex gap-2">
              {/* Weekday labels */}
              <div className="flex flex-col gap-1 pt-8">
                {weekdayLabels.map((day, idx) => (
                  <div key={day} className="h-[14px] text-xs text-muted-foreground text-right pr-2" style={{ opacity: idx % 2 === 0 ? 1 : 0 }}>{day}</div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="flex-1">
                {/* Month labels */}
                <div className="flex gap-1 mb-2 pb-2">
                  {weeks.map((weekStart, weekIdx) => {
                    const month = format(weekStart, "MMM")
                    const isFirstWeekOfMonth = weekStart.getDate() <= 7
                    return (
                      <div key={weekIdx} className="w-[14px]">
                        {isFirstWeekOfMonth && (
                          <div className="text-xs text-muted-foreground -mt-5">{month}</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Heatmap cells */}
                <div className="flex gap-1">
                  {weeks.map((weekStart, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                        const day = new Date(weekStart)
                        day.setDate(day.getDate() + dayOffset)
                        const dayData = heatmapData.find((d) => isSameDay(d.date, day))
                        const count = dayData?.count || 0
                        const isTodayDate = isToday(day)

                        return (
                          <div
                            key={dayOffset}
                            className={`w-[14px] h-[14px] rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-2 hover:ring-primary hover:z-10 ${getIntensity(count, day)}`}
                            title={`${format(day, "MMM d, yyyy")}: ${count} ${count === 1 ? "commit" : "commits"}${isTodayDate ? " (Today)" : ""}`}
                            onClick={() => dayData && setSelectedDay(dayData)}
                            onMouseEnter={(e) => {
                              if (dayData && dayData.count > 0) {
                                e.currentTarget.style.transform = "scale(1.25)"
                                e.currentTarget.style.zIndex = "10"
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = ""
                              e.currentTarget.style.zIndex = ""
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Less</span>
                    <div className="flex gap-1">
                      <div className="w-[14px] h-[14px] rounded-sm bg-[#c6e48b] dark:bg-[#0e4429]" />
                      <div className="w-[14px] h-[14px] rounded-sm bg-[#7bc96f] dark:bg-[#006d32]" />
                      <div className="w-[14px] h-[14px] rounded-sm bg-[#239a3b] dark:bg-[#26a641]" />
                      <div className="w-[14px] h-[14px] rounded-sm bg-[#196127] dark:bg-[#39d353]" />
                    </div>
                    <span className="text-sm text-muted-foreground">More</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-[14px] h-[14px] rounded-sm bg-[#c6e48b] dark:bg-[#0e4429] border-2 border-blue-400 dark:border-blue-500" />
                    <span className="text-muted-foreground">Today - active work</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialog for day commits */}
        <Dialog
          open={!!selectedDay}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDay(null)
              setSearchQuery("")
              setSelectedProjectId(null)
            }
          }}
        >
          <DialogContent className="max-w-5xl">
            <DialogClose
              onClick={() => {
                setSelectedDay(null)
                setSearchQuery("")
                setSelectedProjectId(null)
              }}
            />
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {selectedDay && format(selectedDay.date, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
            </DialogHeader>
            <DialogContentInner>
              {selectedDayCommits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No commits on this day
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats and Filters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{selectedDayCommits.length}</span>{" "}
                        {selectedDayCommits.length === 1 ? "commit" : "commits"} across{" "}
                        <span className="font-semibold text-foreground">{selectedProject?.length || 0}</span>{" "}
                        {selectedProject?.length === 1 ? "project" : "projects"}
                        {filteredCommits.length !== selectedDayCommits.length && (
                          <span className="ml-2">
                            (showing {filteredCommits.length})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search commits, authors, or IDs..."
                          className="w-full pl-10 pr-10 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Project Filter */}
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select
                          value={selectedProjectId || ""}
                          onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                          className="pl-10 pr-8 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                        >
                          <option value="">All Projects</option>
                          {selectedProject?.map((p) => (
                            <option key={p?.id} value={p?.id}>
                              {p?.name}
                            </option>
                          ))}
                        </select>
                        {selectedProjectId && (
                          <button
                            onClick={() => setSelectedProjectId(null)}
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Commits List */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredCommits.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No commits match your filters
                      </div>
                    ) : (
                      filteredCommits.map((commit, idx) => {
                        const project = projects.find((p) => p.id === commit.projectId)
                        const hasStats = commit.stats && (commit.stats.additions > 0 || commit.stats.deletions > 0)

                        return (
                          <div
                            key={`${commit.id}-${idx}`}
                            className="border rounded-lg bg-card hover:border-primary/50 hover:shadow-md transition-all group/card"
                          >
                            <a
                              href={`${project?.web_url || ""}/-/commit/${commit.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-4"
                            >
                              <div className="space-y-3">
                                {/* Header: Commit ID and Project */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                      <span className="font-mono text-sm font-bold text-primary">
                                        {commit.short_id || commit.id.substring(0, 8)}
                                      </span>
                                    </div>
                                    {project && (
                                      <a
                                        href={project.web_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors truncate flex items-center gap-1"
                                      >
                                        <GitCommit className="h-3.5 w-3.5 shrink-0" />
                                        {project.name}
                                      </a>
                                    )}
                                  </div>
                                  {hasStats && (
                                    <div className="flex items-center gap-2 shrink-0 text-xs">
                                      {commit.stats!.additions > 0 && (
                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                          <Plus className="h-3.5 w-3.5" />
                                          {commit.stats!.additions}
                                        </span>
                                      )}
                                      {commit.stats!.deletions > 0 && (
                                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                          <Minus className="h-3.5 w-3.5" />
                                          {commit.stats!.deletions}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Commit Message */}
                                <div className="space-y-1">
                                  <div className="text-base font-semibold text-foreground group-hover/card:text-primary transition-colors line-clamp-2">
                                    {commit.title || commit.message.split("\n")[0]}
                                  </div>
                                  {commit.message.includes("\n") && commit.message.split("\n").length > 1 && (
                                    <div className="text-sm text-muted-foreground line-clamp-3 pl-4 border-l-2 border-muted">
                                      {commit.message.split("\n").slice(1).join("\n")}
                                    </div>
                                  )}
                                </div>

                                {/* Footer: Author and Time */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-muted/50">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="font-medium">{commit.author_name}</span>
                                    <span className="text-xs opacity-75">({commit.author_email})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{format(new Date(commit.committed_date), "HH:mm:ss")}</span>
                                  </div>
                                  {hasStats && (
                                    <div className="text-xs opacity-75">
                                      {commit.stats!.total} {commit.stats!.total === 1 ? "change" : "changes"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </a>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </DialogContentInner>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

