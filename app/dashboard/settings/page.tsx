"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { autoApplyAPI } from "@/lib/api"
import { Slider } from "@/components/ui/slider"

interface Settings {
  auto_apply_enabled: boolean
  daily_limit: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ auto_apply_enabled: false, daily_limit: 5 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await autoApplyAPI.getSettings()
      setSettings(data)
    } catch (err: any) {
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setError("")
      setSuccess("")
      await autoApplyAPI.updateSettings(settings)
      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="text-center mt-10">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Auto-Apply Settings */}
          <Card className="p-6 glassmorphic border-border/20 mb-6">
            <h2 className="text-xl font-semibold mb-4">Auto-Apply Settings</h2>
            
            <div className="space-y-6">
              {/* Enable/Disable Auto-Apply */}
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Auto-Apply</Label>
                  <p className="text-sm text-muted-foreground mt-1">Automatically apply to jobs matching your criteria</p>
                </div>
                <Switch
                  checked={settings.auto_apply_enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_apply_enabled: checked })
                  }
                />
              </div>

              {/* Daily Application Limit */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Daily Application Limit</Label>
                  <span className="text-lg font-semibold text-primary">{settings.daily_limit}</span>
                </div>
                <Slider
                  value={[settings.daily_limit]}
                  onValueChange={(value) => 
                    setSettings({ ...settings, daily_limit: value[0] })
                  }
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Limit the number of automatic applications per day (1-50)
                </p>
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-6 glassmorphic border-border/20 mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notifications" className="text-base">Email Notifications</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="notifications" defaultChecked className="w-4 h-4" />
                  <label htmlFor="notifications" className="text-sm">Receive job matches and application updates</label>
                </div>
              </div>

              <div>
                <Label htmlFor="weekly-digest" className="text-base">Weekly Digest</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="weekly-digest" defaultChecked className="w-4 h-4" />
                  <label htmlFor="weekly-digest" className="text-sm">Get a weekly summary of your job search progress</label>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Settings
            </Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
