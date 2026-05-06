"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, RefreshCw } from "lucide-react"
import { useState } from "react"
import { automationAPI } from "@/lib/api"

interface Application {
  id: number
  job_id: number
  status: string
  title: string
  company: string
  applied_date?: string
}

interface CompanyStats {
  name: string
  count: number
  statuses: { [key: string]: number }
}

export function AppliedCompanies({ 
  applications, 
  onSync 
}: { 
  applications: Application[]
  onSync?: () => void
}) {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage("")
    
    try {
      // Get credentials from localStorage or prompt user
      let naukriEmail = localStorage.getItem("naukri_email") || ""
      let naukriPassword = localStorage.getItem("naukri_password") || ""
      
      if (!naukriEmail || !naukriPassword) {
        setSyncMessage("⚠️ Please save your Naukri credentials in automation settings first, then try again.")
        setSyncing(false)
        return
      }

      const result = await automationAPI.syncNaukri(naukriEmail, naukriPassword)
      
      if (result.success) {
        setSyncMessage(`✅ Synced ${result.syncedCount} applications from Naukri!`)
        // Call parent callback to refresh data
        if (onSync) {
          setTimeout(() => onSync(), 1000)
        }
      } else {
        setSyncMessage(`❌ Sync failed: ${result.message}`)
      }
    } catch (err: any) {
      setSyncMessage(`❌ Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  // Extract unique companies and their statistics
  const companyStats = applications.reduce((acc, app) => {
    const existing = acc.find((c) => c.name === app.company)
    if (existing) {
      existing.count += 1
      existing.statuses[app.status] = (existing.statuses[app.status] || 0) + 1
    } else {
      acc.push({
        name: app.company,
        count: 1,
        statuses: { [app.status]: 1 },
      })
    }
    return acc
  }, [] as CompanyStats[])

  // Sort by application count (descending)
  companyStats.sort((a, b) => b.count - a.count)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800"
      case "viewed":
        return "bg-purple-100 text-purple-800"
      case "interview":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <h2 className="font-bold">Applied Companies ({companyStats.length})</h2>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>
      
      {syncMessage && (
        <div className={`mb-4 p-2 text-sm rounded ${
          syncMessage.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {syncMessage}
        </div>
      )}
      
      {companyStats.length === 0 ? (
        <p className="text-muted-foreground text-sm">No companies yet. Click "Sync" to fetch from Naukri.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {companyStats.map((company) => (
            <div
              key={company.name}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{company.name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(company.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant="outline"
                      className={`text-xs capitalize ${getStatusColor(status)}`}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="ml-2 text-right">
                <p className="text-lg font-bold text-primary">{company.count}</p>
                <p className="text-xs text-muted-foreground">applications</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
