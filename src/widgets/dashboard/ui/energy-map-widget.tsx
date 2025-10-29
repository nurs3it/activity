"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { useGitLabProjects } from "@/shared/hooks"
import { gitlabApi } from "@/shared/api/gitlab-client"
import type { GitLabCommit, GitLabMergeRequest } from "@/shared/api/gitlab-client"
import { useState, useEffect } from "react"
import { subDays } from "date-fns"
import Link from "next/link"
import { Zap, GitBranch, GitCommit, AlertCircle, TrendingUp } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface ProjectEnergy {
  id: number
  name: string
  name_with_namespace: string
  web_url: string
  energy: number
  commits: number
  mrs: number
  issues: number
}

export function EnergyMapWidget() {
  const { projects } = useGitLabProjects()
  const [projectEnergies, setProjectEnergies] = useState<ProjectEnergy[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"energy" | "name">("energy")

  useEffect(() => {
    async function fetchEnergy() {
      try {
        setLoading(true)
        const energies: ProjectEnergy[] = []
        const daysAgo = subDays(new Date(), 7)

        // Обрабатываем проекты последовательно небольшими батчами
        const batchSize = 5
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        // Обрабатываем батчи последовательно
        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем коммиты и MR - достаточно по 100 для расчета активности
              const [commits, mrs] = await Promise.all([
                gitlabApi.getCommits(project.id, {
                  since: daysAgo.toISOString(),
                  per_page: 100,
                }).catch(() => []),
                gitlabApi.getMergeRequests(project.id, {
                  per_page: 100,
                }).catch(() => []),
              ])

              const energy = commits.length * 2 + mrs.length * 5 + project.open_issues_count

              return {
                id: project.id,
                name: project.name,
                name_with_namespace: project.name_with_namespace,
                web_url: project.web_url,
                energy,
                commits: commits.length,
                mrs: mrs.length,
                issues: project.open_issues_count,
              }
            } catch (err) {
              console.error(`Error fetching energy for ${project.id}:`, err)
              return {
                id: project.id,
                name: project.name,
                name_with_namespace: project.name_with_namespace,
                web_url: project.web_url,
                energy: 0,
                commits: 0,
                mrs: 0,
                issues: project.open_issues_count || 0,
              }
            }
          })

          const batchResults = await Promise.all(batchPromises)
          energies.push(...batchResults)
        }

        if (sortBy === "energy") {
          energies.sort((a, b) => b.energy - a.energy)
        } else {
          energies.sort((a, b) => a.name.localeCompare(b.name))
        }

        setProjectEnergies(energies)
      } catch (err) {
        console.error("Error fetching energy:", err)
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchEnergy()
    }
  }, [projects, sortBy])

  const getEnergyLevel = (energy: number) => {
    if (energy > 100) return { label: "Very High", color: "text-red-600", bgColor: "bg-red-500", barColor: "bg-red-500" }
    if (energy > 50) return { label: "High", color: "text-orange-600", bgColor: "bg-orange-500", barColor: "bg-orange-500" }
    if (energy > 20) return { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-500", barColor: "bg-yellow-500" }
    if (energy > 0) return { label: "Low", color: "text-green-600", bgColor: "bg-green-500", barColor: "bg-green-500" }
    return { label: "Inactive", color: "text-gray-500", bgColor: "bg-gray-400", barColor: "bg-gray-400" }
  }

  const maxEnergy = Math.max(...projectEnergies.map((p) => p.energy), 1)

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Energy Map</h3>
              <p className="text-sm text-muted-foreground">Project activity for the last 7 days</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy("energy")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                sortBy === "energy"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              )}
            >
              By Activity
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                sortBy === "name"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              )}
            >
              By Name
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground">Loading data...</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {projectEnergies.map((project) => {
              const level = getEnergyLevel(project.energy)
              const energyPercentage = (project.energy / maxEnergy) * 100

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block group"
                >
                  <div className="border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("w-3 h-3 rounded-full", level.bgColor)} />
                          <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </h4>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", level.color, "bg-current/10")}>
                            {level.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-3">
                          {project.name_with_namespace}
                        </p>

                        {/* Energy Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Energy: {project.energy} pts</span>
                            <span>{Math.round(energyPercentage)}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all", level.barColor)}
                              style={{ width: `${energyPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <GitCommit className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{project.commits}</span>
                            <span className="text-muted-foreground">commits</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{project.mrs}</span>
                            <span className="text-muted-foreground">MR</span>
                          </div>
                          {project.issues > 0 && (
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="font-medium">{project.issues}</span>
                              <span className="text-muted-foreground">issues</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={cn("text-2xl font-bold", level.color)}>
                          {project.energy}
                        </div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && projectEnergies.length > 0 && (
          <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Shown: <span className="font-semibold text-foreground">{projectEnergies.length}</span> of{" "}
              <span className="font-semibold text-foreground">{projects.length}</span> projects
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Very High</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}