"use client"

import { PipelineStatusWall } from "@/widgets/dashboard"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PipelinesPage() {
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
          <div>
            <h1 className="text-4xl font-bold mb-2">Recent Pipelines</h1>
            <p className="text-lg text-muted-foreground">
              Latest pipeline runs and their status
            </p>
          </div>
        </div>

        {/* Pipeline Status Wall */}
        <PipelineStatusWall />
      </div>
    </main>
  )
}

