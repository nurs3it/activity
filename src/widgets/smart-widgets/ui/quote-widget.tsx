"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { useGitLabMergeRequests } from "@/shared/hooks"
import { Quote } from "lucide-react"
import { useState, useEffect } from "react"

export function QuoteWidget() {
  const { mergeRequests } = useGitLabMergeRequests()
  const [quote, setQuote] = useState<string | null>(null)

  useEffect(() => {
    if (mergeRequests.length > 0) {
      const randomMR = mergeRequests[Math.floor(Math.random() * mergeRequests.length)]
      setQuote(randomMR.title || "Нет интересных коммитов")
    }
  }, [mergeRequests])

  const refreshQuote = () => {
    if (mergeRequests.length > 0) {
      const randomMR = mergeRequests[Math.floor(Math.random() * mergeRequests.length)]
      setQuote(randomMR.title || "Нет интересных коммитов")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="h-5 w-5" />
          Quote of the Day
        </CardTitle>
        <CardDescription>Случайная commit message или MR title</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-lg italic text-center min-h-[60px] flex items-center justify-center">
            {quote || "Загрузка..."}
          </p>
          <button
            onClick={refreshQuote}
            className="w-full py-2 px-4 rounded-md bg-muted hover:bg-accent transition-colors text-sm"
          >
            Обновить
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
