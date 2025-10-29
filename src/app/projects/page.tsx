"use client"

import { ProjectList } from "@/features/projects"
import { useState, useMemo } from "react"
import { Search } from "@/shared/ui/search"
import { useGitLabProjects } from "@/shared/hooks"
import Link from "next/link"
import { ExternalLink, ArrowUpDown, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import type { GitLabProject } from "@/shared/api/gitlab-client"

type SortField = "name" | "stars" | "forks" | "issues" | "updated"
type SortOrder = "asc" | "desc"
type ViewMode = "cards" | "compact"

export default function ProjectsPage() {
  const { projects, loading } = useGitLabProjects()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [groupByNamespace, setGroupByNamespace] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("compact")
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null)

  // Группировка по namespace
  const groupedProjects = useMemo(() => {
    if (!groupByNamespace) {
      return { "": projects }
    }

    const groups: Record<string, GitLabProject[]> = {}
    projects.forEach((project) => {
      const namespace = project.name_with_namespace.split("/").slice(0, -1).join("/") || "Ungrouped"
      if (!groups[namespace]) {
        groups[namespace] = []
      }
      groups[namespace].push(project)
    })

    return groups
  }, [projects, groupByNamespace])

  const sortedGroups = useMemo(() => {
    return Object.entries(groupedProjects).sort(([a], [b]) => {
      if (a === "") return 1
      if (b === "") return -1
      return a.localeCompare(b)
    })
  }, [groupedProjects])

  // Фильтрация и сортировка
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project) =>
      searchQuery
        ? project.name_with_namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.description || "").toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )

    // Фильтрация по namespace
    if (selectedNamespace) {
      filtered = filtered.filter((project) => {
        const namespace = project.name_with_namespace.split("/").slice(0, -1).join("/") || "Ungrouped"
        return namespace === selectedNamespace
      })
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "stars":
          comparison = a.star_count - b.star_count
          break
        case "forks":
          comparison = a.forks_count - b.forks_count
          break
        case "issues":
          comparison = a.open_issues_count - b.open_issues_count
          break
        case "updated":
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [projects, searchQuery, sortField, sortOrder, selectedNamespace])

  // Получаем все namespace для фильтра
  const namespaces = useMemo(() => {
    const nsSet = new Set<string>()
    projects.forEach((project) => {
      const namespace = project.name_with_namespace.split("/").slice(0, -1).join("/") || "Ungrouped"
      nsSet.add(namespace)
    })
    return Array.from(nsSet).sort()
  }, [projects])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">All GitLab projects</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {projects.length}
            {filteredAndSortedProjects.length !== projects.length && (
              <span className="ml-2">(filtered: {filteredAndSortedProjects.length})</span>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <Search
                placeholder="Search projects..."
                onSearch={setSearchQuery}
                className="w-full"
              />
            </div>

            {/* Namespace Filter */}
            {groupByNamespace && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedNamespace || ""}
                  onChange={(e) => setSelectedNamespace(e.target.value || null)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Namespaces</option>
                  {namespaces.map((ns) => (
                    <option key={ns} value={ns}>
                      {ns}
                    </option>
                  ))}
                </select>
                {selectedNamespace && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNamespace(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Group By Toggle */}
            <Button
              variant={groupByNamespace ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByNamespace(!groupByNamespace)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {groupByNamespace ? "Grouped" : "Ungrouped"}
            </Button>

            {/* View Mode Toggle */}
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode(viewMode === "compact" ? "cards" : "compact")}
            >
              {viewMode === "compact" ? "Compact" : "Cards"}
            </Button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {(["name", "stars", "forks", "issues", "updated"] as SortField[]).map((field) => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSort(field)}
                className="gap-2 capitalize"
              >
                {field}
                {sortField === field && (
                  sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading projects...</p>
            </CardContent>
          </Card>
        ) : groupByNamespace && !selectedNamespace ? (
          /* Grouped View */
          <div className="space-y-8">
            {sortedGroups.map(([namespace, namespaceProjects]) => {
              const filtered = namespaceProjects.filter((project) =>
                searchQuery
                  ? project.name_with_namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (project.description || "").toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )

              if (filtered.length === 0) return null

              return (
                <div key={namespace}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold">{namespace || "Ungrouped"}</h2>
                    <Badge variant="secondary">{filtered.length}</Badge>
                  </div>
                  <div className={viewMode === "compact" ? "space-y-1" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                    {filtered.map((project) => (
                      <ProjectCard key={project.id} project={project} compact={viewMode === "compact"} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className={viewMode === "compact" ? "space-y-1" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} compact={viewMode === "compact"} />
            ))}
          </div>
        )}

        {filteredAndSortedProjects.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

function ProjectCard({ project, compact }: { project: GitLabProject; compact: boolean }) {
  if (compact) {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="block border rounded-lg p-3 hover:bg-accent transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{project.name}</h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{project.name_with_namespace}</p>
          </div>
          <div className="flex items-center gap-3 ml-4 text-xs text-muted-foreground shrink-0">
            <span>⭐ {project.star_count}</span>
            <span>🍴 {project.forks_count}</span>
            <span>📋 {project.open_issues_count}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/projects/${project.id}`} className="group">
      <Card className="h-full hover:shadow-md transition-all hover:border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          <CardDescription className="line-clamp-1 text-xs">
            {project.name_with_namespace}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>⭐ {project.star_count}</span>
            <span>🍴 {project.forks_count}</span>
            <span>📋 {project.open_issues_count}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
