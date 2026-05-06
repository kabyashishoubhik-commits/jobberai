"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { JobCard } from "@/components/job-card"
import { AppliedCompanies } from "@/components/applied-companies"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { jobsAPI, applicationsAPI, analyticsAPI } from "@/lib/api"
import { RefreshCw } from "lucide-react"

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary?: string
  description?: string
}

interface Application {
  id: number
  job_id: number
  status: string
  title: string
  company: string
  applied_date?: string
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState({ totalApplications: 0, interviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      const [jobsData, appsData, statsData] = await Promise.all([
        jobsAPI.getRecommended(),
        applicationsAPI.getMyApplications(),
        analyticsAPI.getStats(),
      ])
      setJobs(jobsData)
      setApplications(appsData)
      setStats(statsData)
    } catch (err) {
      console.error(err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const handleSyncComplete = () => {
    // Reload applications after sync
    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApply = async (jobId: number) => {
    try {
      await applicationsAPI.apply(jobId)
      // Reload applications
      const appsData = await applicationsAPI.getMyApplications()
      setApplications(appsData)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isAlreadyApplied = (jobId: number) => {
    return applications.some(app => app.job_id === jobId)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <DashboardStats />

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Jobs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recommended Jobs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recommended Jobs</h2>
                  <Badge variant="outline">Auto-Apply Active</Badge>
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading jobs...</div>
                ) : jobs.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No jobs available yet</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        title={job.title}
                        company={job.company}
                        location={job.location}
                        salary={job.salary}
                        description={job.description}
                        matchScore={85}
                        tags={["Recommended"]}
                        posted="Just now"
                        isApplied={isAlreadyApplied(job.id)}
                        onApply={() => handleApply(job.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Stats & Recent Activity */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card className="p-6">
                <h2 className="font-bold mb-4">Your Statistics</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Applications</p>
                    <p className="text-3xl font-bold">{stats.totalApplications}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interviews</p>
                    <p className="text-3xl font-bold">{stats.interviewCount}</p>
                  </div>
                </div>
              </Card>

              {/* Auto-Apply Status */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h2 className="font-bold mb-4">🤖 Auto-Apply Status</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span>5 applications</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applied Today:</span>
                    <span>
                      {
                        applications.filter((application) => {
                          if (!application.applied_date) return false
                          return new Date(application.applied_date).toDateString() === new Date().toDateString()
                        }).length
                      }
                    </span>
                  </div>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90" asChild>
                    <a href="/dashboard/settings">Configure</a>
                  </Button>
                </div>
              </Card>

              {/* Applied Companies */}
              <AppliedCompanies applications={applications} onSync={handleSyncComplete} />

              {/* Recent Applications */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold">All Applications ({applications.length})</h2>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                  {applications.length === 0 ? (
                    <p className="text-muted-foreground">No applications yet</p>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                        <div>
                          <p className="font-medium">{app.title}</p>
                          <p className="text-xs text-muted-foreground">{app.company}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{app.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
