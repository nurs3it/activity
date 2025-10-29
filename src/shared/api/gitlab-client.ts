import { gitlabConfig } from "../config/gitlab"

export interface GitLabProject {
  id: number
  name: string
  name_with_namespace: string
  path: string
  path_with_namespace: string
  description: string | null
  default_branch: string
  created_at: string
  updated_at: string
  web_url: string
  avatar_url: string | null
  star_count: number
  forks_count: number
  open_issues_count: number
  visibility: string
}

export interface GitLabUser {
  id: number
  name: string
  username: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface GitLabMergeRequest {
  id: number
  iid: number
  project_id: number
  title: string
  description: string | null
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  author: GitLabUser
  web_url: string
}

export interface GitLabPipeline {
  id: number
  project_id: number
  ref: string
  status: string
  source: string
  created_at: string
  updated_at: string
  web_url: string
}

export interface GitLabCommit {
  id: string
  short_id: string
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committed_date: string
  created_at: string
  stats?: {
    additions: number
    deletions: number
    total: number
  }
}

export interface GitLabIssue {
  id: number
  iid: number
  project_id: number
  title: string
  description: string | null
  state: string
  created_at: string
  updated_at: string
  closed_at: string | null
  author: GitLabUser
  web_url: string
}

export interface GitLabBranch {
  name: string
  merged: boolean
  protected: boolean
  developers_can_push: boolean
  developers_can_merge: boolean
  default: boolean
  can_push: boolean
  commit?: {
    id: string
    short_id: string
    title: string
    created_at: string
    parent_ids: string[]
  }
}

export interface GitLabRepositoryFile {
  file_name: string
  file_path: string
  size: number
  encoding: string
  content_sha256: string
  ref: string
  blob_id: string
  commit_id: string
  last_commit_id: string
  content?: string
}

export interface GitLabPipelineDetail extends GitLabPipeline {
  duration: number | null
  queued_duration: number | null
  coverage: string | null
  web_url: string
}

export interface GitLabProjectStatistics {
  commit_count: number
  storage_size: number
  repository_size: number
  wiki_size: number
  lfs_objects_size: number
  job_artifacts_size: number
  packages_size: number
  snippets_size: number
}

// Кеш для предотвращения дублирующих запросов
const requestCache = new Map<string, Promise<any>>()

// Импортируем кеш динамически (будет доступен после загрузки модуля)
let cacheModule: { getCached: <T>(key: string, ttl?: number) => T | null; setCached: <T>(key: string, data: T, ttl?: number) => void } | null = null

async function getCacheModule() {
  if (!cacheModule) {
    try {
      cacheModule = await import("../lib/api-cache")
    } catch {
      cacheModule = {
        getCached: () => null,
        setCached: () => {},
      }
    }
  }
  return cacheModule
}

export class GitLabApiClient {
  private baseUrl: string
  private headers: HeadersInit

  constructor() {
    this.baseUrl = gitlabConfig.baseApiUrl
    this.headers = {
      "Content-Type": "application/json",
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit, cacheTtl?: number): Promise<T> {
    // Создаем ключ кеша на основе endpoint (включает query параметры)
    const cacheKey = endpoint

    // Проверяем долгосрочный кеш
    if (cacheTtl) {
      const cache = await getCacheModule()
      const cached = cache.getCached<T>(cacheKey, cacheTtl)
      if (cached !== null) {
        return cached
      }
    }
    
    // Если запрос уже выполняется, возвращаем тот же промис
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<T>
    }

    // Создаем новый запрос
    const requestPromise = (async () => {
      try {
        const url = `${this.baseUrl}${endpoint}`
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.headers,
            ...options?.headers,
          },
        })

        if (!response.ok) {
          throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Сохраняем в долгосрочный кеш если указан TTL
        if (cacheTtl) {
          const cache = await getCacheModule()
          cache.setCached(cacheKey, data, cacheTtl)
        }
        
        // Удаляем из промис-кеша после успешного выполнения
        setTimeout(() => {
          requestCache.delete(cacheKey)
        }, 1000)
        
        return data as T
      } catch (error) {
        // Удаляем из кеша при ошибке сразу
        requestCache.delete(cacheKey)
        throw error
      }
    })()

    // Сохраняем промис в кеш
    requestCache.set(cacheKey, requestPromise)

    return requestPromise
  }

  async getProjects(params?: { per_page?: number; page?: number }): Promise<GitLabProject[]> {
    const queryParams = new URLSearchParams()
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.page) queryParams.append("page", params.page.toString())

    const endpoint = `/projects?${queryParams.toString()}`
    // Кешируем проекты на 15 минут (они редко меняются)
    return this.request<GitLabProject[]>(endpoint, undefined, 15 * 60 * 1000)
  }

  async getProject(projectId: number): Promise<GitLabProject> {
    // Кешируем информацию о проекте на 30 минут
    return this.request<GitLabProject>(`/projects/${projectId}`, undefined, 30 * 60 * 1000)
  }

  async getMergeRequests(
    projectId?: number,
    params?: { state?: string; per_page?: number; page?: number }
  ): Promise<GitLabMergeRequest[]> {
    const queryParams = new URLSearchParams()
    if (params?.state) queryParams.append("state", params.state)
    // Ограничиваем per_page для производительности
    const perPage = Math.min(params?.per_page || 100, 500)
    queryParams.append("per_page", perPage.toString())
    if (params?.page) queryParams.append("page", params.page.toString())

    const endpoint = projectId
      ? `/projects/${projectId}/merge_requests?${queryParams.toString()}`
      : `/merge_requests?${queryParams.toString()}`
    // Кешируем MR на 5 минут
    return this.request<GitLabMergeRequest[]>(endpoint, undefined, 5 * 60 * 1000)
  }

  async getPipelines(
    projectId?: number,
    params?: { status?: string; per_page?: number; page?: number }
  ): Promise<GitLabPipeline[]> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    // Ограничиваем per_page для производительности
    const perPage = Math.min(params?.per_page || 100, 500)
    queryParams.append("per_page", perPage.toString())
    if (params?.page) queryParams.append("page", params.page.toString())

    const endpoint = projectId
      ? `/projects/${projectId}/pipelines?${queryParams.toString()}`
      : `/pipelines?${queryParams.toString()}`
    // Кешируем пайплайны на 3 минуты (они обновляются чаще)
    return this.request<GitLabPipeline[]>(endpoint, undefined, 3 * 60 * 1000)
  }

  async getCommits(
    projectId: number,
    params?: { since?: string; until?: string; per_page?: number; page?: number }
  ): Promise<GitLabCommit[]> {
    const queryParams = new URLSearchParams()
    if (params?.since) queryParams.append("since", params.since)
    if (params?.until) queryParams.append("until", params.until)
    // Ограничиваем per_page для производительности - для статистики достаточно 100-500
    const perPage = Math.min(params?.per_page || 100, 500)
    queryParams.append("per_page", perPage.toString())
    if (params?.page) queryParams.append("page", params.page.toString())

    const endpoint = `/projects/${projectId}/repository/commits?${queryParams.toString()}`
    // Кешируем коммиты на 5 минут
    return this.request<GitLabCommit[]>(endpoint, undefined, 5 * 60 * 1000)
  }

  async getCurrentUser(): Promise<GitLabUser> {
    return this.request<GitLabUser>("/user")
  }

  async getIssues(
    projectId?: number,
    params?: { state?: string; per_page?: number; page?: number; labels?: string }
  ): Promise<GitLabIssue[]> {
    const queryParams = new URLSearchParams()
    if (params?.state) queryParams.append("state", params.state)
    // Ограничиваем per_page для производительности
    const perPage = Math.min(params?.per_page || 100, 500)
    queryParams.append("per_page", perPage.toString())
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.labels) queryParams.append("labels", params.labels)

    const endpoint = projectId
      ? `/projects/${projectId}/issues?${queryParams.toString()}`
      : `/issues?${queryParams.toString()}`
    // Кешируем issues на 5 минут
    return this.request<GitLabIssue[]>(endpoint, undefined, 5 * 60 * 1000)
  }

  async getBranches(
    projectId: number,
    params?: { per_page?: number; page?: number; search?: string }
  ): Promise<GitLabBranch[]> {
    const queryParams = new URLSearchParams()
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.search) queryParams.append("search", params.search)

    return this.request<GitLabBranch[]>(`/projects/${projectId}/repository/branches?${queryParams.toString()}`)
  }

  async getProjectStatistics(projectId: number): Promise<GitLabProjectStatistics> {
    return this.request<GitLabProjectStatistics>(`/projects/${projectId}/statistics`)
  }

  async getPipelineDetail(projectId: number, pipelineId: number): Promise<GitLabPipelineDetail> {
    return this.request<GitLabPipelineDetail>(`/projects/${projectId}/pipelines/${pipelineId}`)
  }

  async getCommitsWithStats(
    projectId: number,
    params?: { since?: string; until?: string; per_page?: number; path?: string }
  ): Promise<GitLabCommit[]> {
    const queryParams = new URLSearchParams()
    if (params?.since) queryParams.append("since", params.since)
    if (params?.until) queryParams.append("until", params.until)
    if (params?.per_page) queryParams.append("per_page", params.per_page.toString())
    if (params?.path) queryParams.append("path", params.path)
    queryParams.append("with_stats", "true")

    return this.request<GitLabCommit[]>(`/projects/${projectId}/repository/commits?${queryParams.toString()}`)
  }

  async getRepositoryTree(
    projectId: number,
    params?: { path?: string; ref?: string; recursive?: boolean }
  ): Promise<GitLabRepositoryFile[]> {
    const queryParams = new URLSearchParams()
    if (params?.path) queryParams.append("path", params.path)
    if (params?.ref) queryParams.append("ref", params.ref)
    if (params?.recursive) queryParams.append("recursive", "true")

    return this.request<GitLabRepositoryFile[]>(`/projects/${projectId}/repository/tree?${queryParams.toString()}`)
  }

  async getMergeRequestDetail(projectId: number, mergeRequestIid: number): Promise<GitLabMergeRequest> {
    return this.request<GitLabMergeRequest>(`/projects/${projectId}/merge_requests/${mergeRequestIid}`)
  }
}

export const gitlabApi = new GitLabApiClient()
