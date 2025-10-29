import { useState, useEffect } from "react"
import { useGitLabProjects } from "./use-gitlab-api"
import { gitlabApi } from "../api/gitlab-client"
import type { GitLabCommit } from "../api/gitlab-client"
import { subWeeks } from "date-fns"

// Global cache для всех коммитов
let commitsCache: Map<number, GitLabCommit[]> | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export function useAllCommits() {
  const { projects } = useGitLabProjects()
  const [allCommits, setAllCommits] = useState<Map<number, GitLabCommit[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchAllCommits() {
      // Проверяем кеш
      if (commitsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setAllCommits(commitsCache)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const weeksAgo = subWeeks(new Date(), 52)
        const commitsMap = new Map<number, GitLabCommit[]>()
        
        // Обрабатываем проекты последовательно небольшими батчами для избежания перегрузки API
        const batchSize = 10
        const projectBatches = []
        for (let i = 0; i < projects.length; i += batchSize) {
          projectBatches.push(projects.slice(i, i + batchSize))
        }

        // Обрабатываем батчи последовательно
        for (const batch of projectBatches) {
          const batchPromises = batch.map(async (project) => {
            try {
              // Для heatmap достаточно 2000 коммитов на проект за год (примерно 5-6 в день)
              const projectCommits = await gitlabApi.getCommits(project.id, {
                since: weeksAgo.toISOString(),
                per_page: 2000,
              }).catch(() => [])
              return { projectId: project.id, commits: projectCommits }
            } catch (err) {
              console.error(`Error fetching commits for project ${project.id}:`, err)
              return { projectId: project.id, commits: [] }
            }
          })

          const batchResults = await Promise.all(batchPromises)
          batchResults.forEach(({ projectId, commits }) => {
            if (commits.length > 0) {
              commitsMap.set(projectId, commits)
            }
          })
        }

        // Сохраняем в кеш
        commitsCache = commitsMap
        cacheTimestamp = Date.now()

        setAllCommits(commitsMap)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error fetching commits"))
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      fetchAllCommits()
    }
  }, [projects])

  return { allCommits, loading, error }
}

