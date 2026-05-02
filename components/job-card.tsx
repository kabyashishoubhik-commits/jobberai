"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookmarkPlus, ArrowUpRight, Loader } from "lucide-react"
import { useState } from "react"
import { applicationsAPI } from "@/lib/api"

interface JobCardProps {
  id?: number
  title: string
  company: string
  location: string
  salary?: string
  matchScore: number
  tags: string[]
  posted: string
  isApplied?: boolean
  onApply?: () => void
}

export function JobCard({ 
  id, 
  title, 
  company, 
  location, 
  salary, 
  matchScore, 
  tags, 
  posted,
  isApplied: initialApplied = false,
  onApply
}: JobCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isApplied, setIsApplied] = useState(initialApplied)
  const [error, setError] = useState("")

  const handleApply = async () => {
    if (!id || isApplied) return

    try {
      setIsLoading(true)
      setError("")
      await applicationsAPI.apply(id)
      setIsApplied(true)
      onApply?.()
    } catch (err: any) {
      setError(err.message || "Failed to apply")
      console.error("Apply error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 glassmorphic border-border/20 hover:shadow-smooth hover:-translate-y-1 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg group-hover:text-primary transition">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {company} • {location}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <BookmarkPlus className="w-5 h-5" />
        </Button>
      </div>

      {salary && <p className="text-sm font-semibold text-accent mb-3">{salary}</p>}

      <div className="flex flex-wrap gap-1 mb-4">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Match Score</p>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <span className="text-sm font-bold">{matchScore}%</span>
          </div>
        </div>
        <Button 
          size="sm" 
          className={`flex items-center gap-1 ${
            isApplied 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-primary hover:bg-primary/90"
          }`}
          onClick={handleApply}
          disabled={isLoading || isApplied}
        >
          {isLoading && <Loader className="w-3 h-3 animate-spin" />}
          {isApplied ? "Applied" : "Apply"} 
          {!isLoading && <ArrowUpRight className="w-3 h-3" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{posted}</p>
    </Card>
  )
}
