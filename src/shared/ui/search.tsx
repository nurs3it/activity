"use client"

import { useState } from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/shared/lib/utils"

interface SearchProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export function Search({ placeholder = "Поиск...", onSearch, className }: SearchProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("")
            onSearch?.("")
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
