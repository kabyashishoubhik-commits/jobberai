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
import { Loader, CheckCircle, AlertCircle, Zap, ExternalLink, PlayCircle, XCircle } from "lucide-react"

interface Credentials {
  linkedinEmail?: string
  linkedinPassword?: string
  wellfoundEmail?: string
  wellfoundPassword?: string
  naukriEmail?: string
  naukriPassword?: string
  fullName?: string
  contactEmail?: string
  phoneNumber?: string
}

interface CredentialStatus {
  linkedinConnected?: boolean
  wellfoundConnected?: boolean
  naukriConnected?: boolean
  fullName?: string
  contactEmail?: string
  phoneNumber?: string
}

const sites = [
  {
    key: "linkedin",
    name: "LinkedIn",
    emailField: "linkedinEmail",
    passwordField: "linkedinPassword",
    connectedField: "linkedinConnected",
    accent: "bg-blue-600 hover:bg-blue-700",
    startText: "Open LinkedIn",
  },
  {
    key: "wellfound",
    name: "Wellfound",
    emailField: "wellfoundEmail",
    passwordField: "wellfoundPassword",
    connectedField: "wellfoundConnected",
    accent: "bg-orange-600 hover:bg-orange-700",
    startText: "Open Wellfound",
  },
  {
    key: "naukri",
    name: "Naukri",
    emailField: "naukriEmail",
    passwordField: "naukriPassword",
    connectedField: "naukriConnected",
    accent: "bg-purple-600 hover:bg-purple-700",
    startText: "Open Naukri.com",
  },
] as const

export default function AutomationSetupPage() {
  const [credentials, setCredentials] = useState<Credentials>({})
  const [credStatus, setCredStatus] = useState<CredentialStatus>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [autoApplyLoading, setAutoApplyLoading] = useState(false)
  const [browserLoading, setBrowserLoading] = useState("")
  const [browserSessions, setBrowserSessions] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCredentialStatus()
  }, [])

  const loadCredentialStatus = async () => {
    try {
      const status = await automationAPI.getCredentials()
      setCredStatus(status)
      // Load personal info
      if (status.fullName || status.contactEmail || status.phoneNumber) {
        setCredentials((prev) => ({
          ...prev,
          fullName: status.fullName || "",
          contactEmail: status.contactEmail || "",
          phoneNumber: status.phoneNumber || "",
        }))
      }
    } catch (err) {
      console.error("Failed to load credential status:", err)
    }
  }

  const clearAlerts = () => {
    setError("")
    setSuccess("")
  }

  const validateSearch = () => {
    if (!searchKeyword || !searchLocation) {
      setError("Please enter job title and location")
      return false
    }
    return true
  }

  const handleSaveCredentials = async () => {
    try {
      setLoading(true)
      clearAlerts()
      await automationAPI.saveCredentials(credentials)
      
      // Store Naukri credentials in localStorage for sync feature
      if (credentials.naukriEmail && credentials.naukriPassword) {
        localStorage.setItem("naukri_email", credentials.naukriEmail)
        localStorage.setItem("naukri_password", credentials.naukriPassword)
      }
      
      await loadCredentialStatus()
      setSuccess("Credentials saved. You can also use visible browser login for Gmail or 2FA accounts.")
      setCredentials({})
    } catch (err: any) {
      setError(err.message || "Failed to save credentials")
    } finally {
      setLoading(false)
    }
  }

  const handleAutoApply = async (source: string) => {
    if (!validateSearch()) return

    try {
      setAutoApplyLoading(true)
      clearAlerts()
      await automationAPI.autoApply(searchKeyword, searchLocation, source)
      setSuccess(`Auto-apply started for ${source}. It will run in the background using saved credentials.`)
    } catch (err: any) {
      setError(err.message || "Failed to start auto-apply")
    } finally {
      setAutoApplyLoading(false)
    }
  }

  const handleOpenBrowser = async (source: string) => {
    try {
      setBrowserLoading(`open:${source}`)
      clearAlerts()
      const result = await automationAPI.openBrowser(source)
      setBrowserSessions((prev) => ({ ...prev, [source]: result.status }))
      setSuccess(result.message)
    } catch (err: any) {
      setError(err.message || "Failed to open browser")
    } finally {
      setBrowserLoading("")
    }
  }

  const handleTakeOverBrowser = async (source: string) => {
    if (!validateSearch()) return

    try {
      setBrowserLoading(`takeover:${source}`)
      clearAlerts()
      const result = await automationAPI.takeOverBrowser(source, searchKeyword, searchLocation)
      setBrowserSessions((prev) => ({ ...prev, [source]: result.status }))
      
      const message = `${result.message}\n\nApplied to ${result.appliedCount || 0} jobs. Redirecting to dashboard to view all applications...`
      setSuccess(message)
      
      // Redirect to dashboard to show applied companies after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to take over browser")
    } finally {
      setBrowserLoading("")
    }
  }

  const handleCloseBrowser = async (source: string) => {
    try {
      setBrowserLoading(`close:${source}`)
      clearAlerts()
      const result = await automationAPI.closeBrowser(source)
      setBrowserSessions((prev) => ({ ...prev, [source]: result.status }))
      setSuccess(result.message)
    } catch (err: any) {
      setError(err.message || "Failed to close browser")
    } finally {
      setBrowserLoading("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browser Automation</h1>
            <p className="text-muted-foreground">Open a real browser, complete login yourself, then let Puppeteer continue.</p>
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

          <Card className="p-6 glassmorphic border-border/20 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Job Search Target</h2>
                <p className="text-sm text-muted-foreground">Used by both saved-credential automation and visible browser takeover.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">Job Title</Label>
                <Input
                  id="keyword"
                  placeholder="Frontend Developer, Data Analyst"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Bengaluru, Remote, Pune"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Visible Browser Login</h2>
            <p className="text-sm text-muted-foreground mb-5">
              For Naukri, the browser opens at{" "}
              <span className="break-all">https://www.naukri.com/myapply/historypage?src=gnbOpportunities</span>. Complete Gmail login or OTP in that browser, then click Take Over.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sites.map((site) => (
                <Card key={site.key} className="p-5 glassmorphic border-border/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{site.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Session: {browserSessions[site.key] || "closed"}
                      </p>
                    </div>
                    <Badge variant="outline">{site.key}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleOpenBrowser(site.key)}
                      disabled={!!browserLoading}
                      className={`w-full ${site.accent}`}
                    >
                      {browserLoading === `open:${site.key}` ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      {site.startText}
                    </Button>
                    <Button
                      onClick={() => handleTakeOverBrowser(site.key)}
                      disabled={!!browserLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {browserLoading === `takeover:${site.key}` ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4 mr-2" />
                      )}
                      Take Over
                    </Button>
                    <Button
                      onClick={() => handleCloseBrowser(site.key)}
                      disabled={!!browserLoading}
                      variant="ghost"
                      className="w-full text-muted-foreground"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Browser
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Saved Credentials Mode</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {sites.map((site) => {
                const connected = !!credStatus[site.connectedField as keyof CredentialStatus]

                return (
                  <Card key={site.key} className={`p-6 glassmorphic border-border/20 ${connected ? "ring-2 ring-green-500/50" : ""}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold">{site.name}</h3>
                      {connected && <Badge className="bg-green-600">Connected</Badge>}
                    </div>

                    {!connected ? (
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
                        <p className="text-sm text-green-700">Account connected</p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            <Card className="p-6 border-border/20 bg-blue-50/30 mt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Personal Information (For External Company Forms)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                These details are used when applying to external company websites through Naukri
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Kabeer Sachdev"
                    value={(credentials.fullName as string) || ""}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        fullName: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="sachdevkabeer@gmail.com"
                    value={(credentials.contactEmail as string) || ""}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        contactEmail: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="9958844216"
                    value={(credentials.phoneNumber as string) || ""}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            <Button onClick={handleSaveCredentials} disabled={loading} className="bg-primary hover:bg-primary/90 w-full mt-6">
              {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving..." : "Save All Accounts & Personal Info"}
            </Button>
          </div>

          <Card className="p-8 glassmorphic border-border/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h2 className="text-2xl font-bold mb-2">Background Auto-Apply</h2>
            <p className="text-sm text-muted-foreground mb-6">Runs headless using saved credentials. Use visible login above for Gmail/OTP accounts.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sites.map((site) => (
                <Button
                  key={site.key}
                  onClick={() => handleAutoApply(site.key)}
                  disabled={autoApplyLoading || !credStatus[site.connectedField as keyof CredentialStatus]}
                  className={site.accent}
                >
                  {autoApplyLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  Apply to {site.name}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-6 glassmorphic border-border/20 mt-8 bg-amber-50/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-amber-900">
              <li>✅ <strong>Direct Naukri Apply:</strong> Jobs with "Apply on Naukri" are automatically filtered and applied.</li>
              <li>⚠️ <strong>Naukri Job Alerts Limit:</strong> "You already have 5 job alerts" is Naukri's limit - it doesn't prevent applications, just alerts.</li>
              <li>📊 <strong>Dashboard Updates:</strong> After automation completes, you'll be redirected to dashboard to see all applied companies.</li>
              <li>🔄 <strong>Refresh:</strong> Use the refresh button on dashboard to reload the latest applications.</li>
              <li>📋 <strong>View Companies:</strong> Check "All Applications" section on dashboard to see all company names you applied to.</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
