import { useState, useEffect } from "react"
import { gitlabApi } from "../api/gitlab-client"
import type { GitLabProject, GitLabMergeRequest, GitLabPipeline, GitLabUser } from "../api/gitlab-client"

export function useGitLabProjects() {
  const [projects, setProjects] = useState<GitLabProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        // Загружаем проекты - используем разумный лимит
        const data = await gitlabApi.getProjects({ per_page: 500 })
        setProjects(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Ошибка загрузки проектов"))
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, loading, error }
}

export function useGitLabMergeRequests(projectId?: number) {
  const { projects, loading: projectsLoading } = useGitLabProjects()
  const [mergeRequests, setMergeRequests] = useState<GitLabMergeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMergeRequests() {
      try {
        setLoading(true)
        
        // Если указан конкретный проект, загружаем только его MR
        if (projectId) {
          const data = await gitlabApi.getMergeRequests(projectId, { per_page: 500 })
          setMergeRequests(data)
          setError(null)
          return
        }

        // Если проект не указан, собираем MR из всех проектов
        // Это более надежно, чем использовать общий endpoint /merge_requests
        const allMRs: GitLabMergeRequest[] = []
        
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
              const projectMRs = await gitlabApi.getMergeRequests(project.id, { per_page: 500 }).catch(() => [])
              return projectMRs
            } catch (err) {
              console.error(`Error fetching MRs for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allMRs.push(...batchResults.flat())
        }

        setMergeRequests(allMRs)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Ошибка загрузки MR"))
      } finally {
        setLoading(false)
      }
    }

    // Ждем загрузки проектов, если projectId не указан
    if (projectId || !projectsLoading) {
      fetchMergeRequests()
    }
  }, [projectId, projects, projectsLoading])

  return { mergeRequests, loading: loading || (projectId === undefined && projectsLoading), error }
}

export function useGitLabPipelines(projectId?: number) {
  const { projects, loading: projectsLoading } = useGitLabProjects()
  const [pipelines, setPipelines] = useState<GitLabPipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPipelines() {
      try {
        setLoading(true)
        
        // Если указан конкретный проект, загружаем только его пайплайны
        if (projectId) {
          const data = await gitlabApi.getPipelines(projectId, { per_page: 500 })
          setPipelines(data)
          setError(null)
          return
        }

        // Если проект не указан, собираем пайплайны из всех проектов
        // Это более надежно, чем использовать общий endpoint /pipelines
        const allPipelines: GitLabPipeline[] = []
        
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
              const projectPipelines = await gitlabApi.getPipelines(project.id, { per_page: 500 }).catch(() => [])
              return projectPipelines
            } catch (err) {
              console.error(`Error fetching pipelines for project ${project.id}:`, err)
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          allPipelines.push(...batchResults.flat())
        }

        setPipelines(allPipelines)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Ошибка загрузки пайплайнов"))
      } finally {
        setLoading(false)
      }
    }

    // Ждем загрузки проектов, если projectId не указан
    if (projectId || !projectsLoading) {
      fetchPipelines()
    }
  }, [projectId, projects, projectsLoading])

  return { pipelines, loading: loading || (projectId === undefined && projectsLoading), error }
}

export function useGitLabCurrentUser() {
  const [user, setUser] = useState<GitLabUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true)
        const data = await gitlabApi.getCurrentUser()
        setUser(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Ошибка загрузки пользователя"))
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, error }
}
