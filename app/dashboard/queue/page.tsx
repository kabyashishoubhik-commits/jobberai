"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { autoApplyAPI } from "@/lib/api"
import { Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react"

interface AutoApplyRule {
  id: number
  title_keywords: string
  location: string
  min_salary?: number
  max_salary?: number
  remote_only: boolean
  active: boolean
  created_at: string
}

export default function AutoApplyQueuePage() {
  const [rules, setRules] = useState<AutoApplyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const data = await autoApplyAPI.getRules()
      setRules(data)
    } catch (err: any) {
      setError("Failed to load auto-apply rules")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Auto Apply Queue</h1>
            <Button className="bg-primary hover:bg-primary/90">Create New Rule</Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">Loading rules...</div>
          ) : rules.length === 0 ? (
            <Card className="p-12 glassmorphic border-border/20 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Auto-Apply Rules</h2>
              <p className="text-muted-foreground mb-6">
                Create rules to automatically apply to jobs matching your criteria
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                Create Your First Rule
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="p-6 glassmorphic border-border/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{rule.title_keywords}</h3>
                        <Badge variant={rule.active ? "default" : "outline"}>
                          {rule.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{rule.location || "Any"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Salary Range</p>
                          <p className="font-medium">
                            {rule.min_salary ? `$${rule.min_salary}` : "Any"}
                            {rule.max_salary ? ` - $${rule.max_salary}` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remote Only</p>
                          <p className="font-medium">{rule.remote_only ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {new Date(rule.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Statistics */}
          {rules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="p-6 glassmorphic border-border/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Rules</p>
                    <p className="text-2xl font-bold">
                      {rules.filter(r => r.active).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 glassmorphic border-border/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Clock className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rules</p>
                    <p className="text-2xl font-bold">{rules.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 glassmorphic border-border/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Applied This Week</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
