import { useMemo } from "react"
import { useGitLabProjects, useGitLabMergeRequests, useGitLabPipelines } from "./use-gitlab-api"
import { gitlabApi } from "../api/gitlab-client"
import { useState, useEffect } from "react"
import { getDateRange, calculateMRTime } from "../lib/date-utils"
import type { GitLabCommit, GitLabIssue } from "../api/gitlab-client"

export function useBasicStatistics(period: "week" | "month" | "all" = "month") {
  const { projects, loading: projectsLoading } = useGitLabProjects()
  const { mergeRequests, loading: mrLoading } = useGitLabMergeRequests()
  const { pipelines, loading: pipelinesLoading } = useGitLabPipelines()
  const [commits, setCommits] = useState<GitLabCommit[]>([])
  const [issues, setIssues] = useState<GitLabIssue[]>([])
  const [commitsLoading, setCommitsLoading] = useState(true)
  const [issuesLoading, setIssuesLoading] = useState(true)

  const dateRange = useMemo(() => getDateRange(period), [period])

  useEffect(() => {
    async function fetchCommits() {
      try {
        setCommitsLoading(true)
        const allCommits: GitLabCommit[] = []
        
        // Обрабатываем проекты последовательно небольшими батчами для избежания перегрузки API
        const batchSize = 5
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        // Обрабатываем батчи последовательно, но внутри батча параллельно
        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Загружаем коммиты для статистики - достаточно 500 за период
              const projectCommits = await gitlabApi.getCommits(project.id, {
                since: dateRange.since,
                until: dateRange.until,
                per_page: 500,
              }).catch(() => [])
              return projectCommits
            } catch (err) {
              console.error(`Error fetching commits for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allCommits.push(...batchResults.flat())
        }

        setCommits(allCommits)
      } catch (err) {
        console.error("Error fetching commits:", err)
      } finally {
        setCommitsLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchCommits()
    }
  }, [projects, dateRange])

  useEffect(() => {
    async function fetchIssues() {
      try {
        setIssuesLoading(true)
        const allIssues: GitLabIssue[] = []
        
        // Собираем issues из всех проектов для точной статистики
        const batchSize = 5
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              const projectIssues = await gitlabApi.getIssues(project.id, { per_page: 500 }).catch(() => [])
              return projectIssues
            } catch (err) {
              console.error(`Error fetching issues for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allIssues.push(...batchResults.flat())
        }

        setIssues(allIssues)
      } catch (err) {
        console.error("Error fetching issues:", err)
      } finally {
        setIssuesLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchIssues()
    }
  }, [projects])

  const loading = projectsLoading || mrLoading || pipelinesLoading || commitsLoading || issuesLoading

  const activeProjects = useMemo(() => {
    if (period === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return projects.filter((p) => new Date(p.updated_at) >= weekAgo).length
    }
    if (period === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return projects.filter((p) => new Date(p.updated_at) >= monthAgo).length
    }
    return projects.length
  }, [projects, period])

  const mrStats = useMemo(() => {
    const opened = mergeRequests.filter((mr) => mr.state === "opened").length
    const merged = mergeRequests.filter((mr) => mr.state === "merged").length
    const closed = mergeRequests.filter((mr) => mr.state === "closed").length

    const mergedMRs = mergeRequests.filter((mr) => mr.state === "merged")
    const mrTimes = mergedMRs.map(calculateMRTime).filter((t): t is number => t !== null)
    const avgMRTime = mrTimes.length > 0 ? mrTimes.reduce((a, b) => a + b, 0) / mrTimes.length : null

    return { opened, merged, closed, avgMRTime }
  }, [mergeRequests])

  const topContributors = useMemo(() => {
    const contributorMap = new Map<string, { name: string; commits: number; mrs: number }>()

    commits.forEach((commit) => {
      const key = commit.author_email
      const existing = contributorMap.get(key) || { name: commit.author_name, commits: 0, mrs: 0 }
      existing.commits++
      contributorMap.set(key, existing)
    })

    mergeRequests.forEach((mr) => {
      const key = mr.author.email
      const existing = contributorMap.get(key) || { name: mr.author.name, commits: 0, mrs: 0 }
      existing.mrs++
      contributorMap.set(key, existing)
    })

    return Array.from(contributorMap.values())
      .sort((a, b) => b.commits + b.mrs - (a.commits + a.mrs))
  }, [commits, mergeRequests])

  const pipelineStats = useMemo(() => {
    const successful = pipelines.filter((p) => p.status === "success").length
    const failed = pipelines.filter((p) => p.status === "failed").length
    const running = pipelines.filter((p) => p.status === "running").length
    const successRate = pipelines.length > 0 ? (successful / pipelines.length) * 100 : 0

    return { successful, failed, running, successRate, total: pipelines.length }
  }, [pipelines])

  return {
    projects,
    projectsCount: projects.length,
    activeProjects,
    commits: commits.length,
    mergeRequests: mrStats,
    issues: {
      opened: issues.filter((i) => i.state === "opened").length,
      closed: issues.filter((i) => i.state === "closed").length,
      total: issues.length,
    },
    topContributors,
    pipelineStats,
    loading,
  }
}
