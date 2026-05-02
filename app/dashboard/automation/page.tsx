"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { automationAPI } from "@/lib/api"
import { Loader, CheckCircle, AlertCircle, Zap } from "lucide-react"

interface Credentials {
  linkedinEmail?: string
  linkedinPassword?: string
  wellfoundEmail?: string
  wellfoundPassword?: string
  naukriEmail?: string
  naukriPassword?: string
}

interface CredentialStatus {
  linkedinConnected: boolean
  wellfoundConnected: boolean
  naukriConnected: boolean
}

export default function AutomationSetupPage() {
  const [credentials, setCredentials] = useState<Credentials>({})
  const [credStatus, setCredStatus] = useState<CredentialStatus>({
    linkedinConnected: false,
    wellfoundConnected: false,
    naukriConnected: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [autoApplyLoading, setAutoApplyLoading] = useState(false)

  useEffect(() => {
    loadCredentialStatus()
  }, [])

  const loadCredentialStatus = async () => {
    try {
      const status = await automationAPI.getCredentials()
      setCredStatus(status)
    } catch (err) {
      console.error("Failed to load credential status:", err)
    }
  }

  const handleSaveCredentials = async () => {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await automationAPI.saveCredentials(credentials)
      await loadCredentialStatus()
      setSuccess("Credentials saved securely!")
      setCredentials({})
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save credentials")
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeAndApply = async (source: string) => {
    if (!searchKeyword || !searchLocation) {
      setError("Please enter job title and location")
      return
    }

    try {
      setAutoApplyLoading(true)
      setError("")
      setSuccess("")

      await automationAPI.scrapeJobs(searchKeyword, searchLocation)
      await automationAPI.autoApply(searchKeyword, searchLocation, source)
      
      setSuccess(`✅ Auto-applying to ${source} jobs! This may take a few minutes...`)
      setSearchKeyword("")
      setSearchLocation("")
      setTimeout(() => setSuccess(""), 5000)
    } catch (err: any) {
      setError(err.message || "Failed to start auto-apply")
    } finally {
      setAutoApplyLoading(false)
    }
  }

  const sites = [
    {
      name: "LinkedIn",
      icon: "💼",
      emailField: "linkedinEmail",
      passwordField: "linkedinPassword",
      connected: credStatus.linkedinConnected,
      color: "from-blue-600 to-blue-700",
    },
    {
      name: "Wellfound",
      icon: "🚀",
      emailField: "wellfoundEmail",
      passwordField: "wellfoundPassword",
      connected: credStatus.wellfoundConnected,
      color: "from-orange-500 to-orange-600",
    },
    {
      name: "Naukri",
      icon: "🇮🇳",
      emailField: "naukriEmail",
      passwordField: "naukriPassword",
      connected: credStatus.naukriConnected,
      color: "from-purple-600 to-purple-700",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browser Automation</h1>
            <p className="text-muted-foreground">
              Connect your job site accounts to enable automatic applications
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Connect Accounts Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Connect Your Accounts</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {sites.map((site) => (
                <Card
                  key={site.name}
                  className={`p-6 glassmorphic border-border/20 ${
                    site.connected ? "ring-2 ring-green-500/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{site.icon}</div>
                    {site.connected && (
                      <Badge className="bg-green-600">Connected</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold mb-4">{site.name}</h3>

                  {!site.connected ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Email</Label>
                        <Input
                          type="email"
                          placeholder={`${site.name} email`}
                          value={(credentials[site.emailField as keyof Credentials] as string) || ""}
                          onChange={(e) =>
                            setCredentials({
                              ...credentials,
                              [site.emailField]: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Password</Label>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={(credentials[site.passwordField as keyof Credentials] as string) || ""}
                          onChange={(e) =>
                            setCredentials({
                              ...credentials,
                              [site.passwordField]: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-100/20 rounded-lg">
                      <p className="text-sm text-green-700">✅ Account connected</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSaveCredentials}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving..." : "Save All Accounts"}
            </Button>
          </div>

          {/* Auto-Apply Section */}
          <Card className="p-8 glassmorphic border-border/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Auto-Apply to Jobs</h2>
                <p className="text-sm text-muted-foreground">
                  Automatically apply to jobs on connected platforms
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="keyword">Job Title</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., Senior Developer, Product Manager"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, Remote"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => handleScrapeAndApply("linkedin")}
                disabled={autoApplyLoading || !credStatus.linkedinConnected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {autoApplyLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Apply to LinkedIn
              </Button>
              <Button
                onClick={() => handleScrapeAndApply("wellfound")}
                disabled={autoApplyLoading || !credStatus.wellfoundConnected}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {autoApplyLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Apply to Wellfound
              </Button>
              <Button
                onClick={() => handleScrapeAndApply("naukri")}
                disabled={autoApplyLoading || !credStatus.naukriConnected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {autoApplyLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Apply to Naukri
              </Button>
            </div>
          </Card>

          {/* Info Box */}
          <Card className="p-6 glassmorphic border-border/20 mt-8 bg-amber-50/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-amber-900">
              <li>✓ Credentials are stored securely on your server</li>
              <li>✓ Browser automation runs in headless mode (no visible window)</li>
              <li>✓ Applications are tracked and logged for your records</li>
              <li>✓ Rate limiting applies to prevent account flagging</li>
              <li>✓ This feature requires active internet connection</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
