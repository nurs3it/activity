"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, GitBranch, Zap, Activity, Workflow } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: GitBranch },
  { name: "Energy Map", href: "/energy-map", icon: Zap },
  { name: "Live Activity", href: "/activity", icon: Activity },
  { name: "Pipelines", href: "/pipelines", icon: Workflow },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">GitLab Dashboard</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
