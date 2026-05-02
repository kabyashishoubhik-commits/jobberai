"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OnboardingStep } from "@/components/onboarding-step"
import Link from "next/link"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { resumeAPI, autoApplyAPI, seedAPI } from "@/lib/api"

export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    roles: "",
    locations: "",
    salaryMin: "",
    salaryMax: "",
    remoteOnly: false,
    autoApplyEnabled: true,
    dailyLimit: 5,
  })

  const steps = [
    {
      number: 1,
      title: "Upload CV",
      description: "AI parses your resume and builds your profile",
      icon: "📄",
    },
    {
      number: 2,
      title: "Set Preferences",
      description: "Choose roles, locations, and salary expectations",
      icon: "⚙️",
    },
    {
      number: 3,
      title: "Configure Auto-Apply",
      description: "Set up your automation rules",
      icon: "🤖",
    },
    {
      number: 4,
      title: "Ready to Go",
      description: "Your job search automation is live",
      icon: "✨",
    },
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      setResumeFile(file)
      setError("")
    }
  }

  const handleUploadResume = async () => {
    if (!resumeFile) {
      setError("Please select a file")
      return
    }

    setIsLoading(true)
    try {
      await resumeAPI.upload(resumeFile)
      setStep(2)
      setResumeFile(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!formData.roles || !formData.locations) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      // Create auto-apply rule
      await autoApplyAPI.createRule({
        titleKeywords: formData.roles,
        location: formData.locations,
        minSalary: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        maxSalary: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        remoteOnly: formData.remoteOnly,
      })
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableAutoApply = async () => {
    setIsLoading(true)
    try {
      // Seed sample jobs first
      await seedAPI.seedJobs()
      
      // Update settings to enable auto-apply
      await autoApplyAPI.updateSettings({
        autoApplyEnabled: formData.autoApplyEnabled,
        dailyLimit: formData.dailyLimit,
      })

      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">JA</span>
            </div>
            <span className="font-bold text-xl">JobAccelerator</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Let's Get You Started</h1>
          <p className="text-muted-foreground">Complete these steps to activate your AI job search</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Steps */}
          <div className="space-y-3">
            {steps.map((s) => (
              <OnboardingStep
                key={s.number}
                number={s.number}
                title={s.title}
                description={s.description}
                icon={s.icon}
                isActive={step === s.number}
                isCompleted={step > s.number}
              />
            ))}
          </div>

          {/* Form */}
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Upload Your Resume</h2>
                <div className="border-2 border-dashed border-border/30 rounded-lg p-8 text-center hover:border-primary/50 transition">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm text-muted-foreground mb-3">Drag and drop your resume or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  {resumeFile && (
                    <p className="text-sm text-primary mt-3">✓ {resumeFile.name}</p>
                  )}
                </div>
                <Button 
                  onClick={handleUploadResume} 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!resumeFile || isLoading}
                >
                  {isLoading ? "Uploading..." : "Continue"}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Job Preferences</h2>
                <Input
                  placeholder="e.g., Product Manager, Senior Engineer"
                  value={formData.roles}
                  onChange={(e) => {
                    setFormData({ ...formData, roles: e.target.value })
                    setError("")
                  }}
                />
                <Input
                  placeholder="e.g., San Francisco, Remote"
                  value={formData.locations}
                  onChange={(e) => {
                    setFormData({ ...formData, locations: e.target.value })
                    setError("")
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Min Salary (e.g., 100000)"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  />
                  <Input
                    type="text"
                    placeholder="Max Salary (e.g., 200000)"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.remoteOnly}
                    onChange={(e) => setFormData({ ...formData, remoteOnly: e.target.checked })}
                  />
                  <span>Remote only</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSavePreferences} 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Auto-Apply Settings</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.autoApplyEnabled}
                      onChange={(e) => setFormData({ ...formData, autoApplyEnabled: e.target.checked })}
                    />
                    <span>Enable auto-apply to matching jobs</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium mb-2">Daily Application Limit</label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleEnableAutoApply} 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-2xl font-bold">You're All Set!</h2>
                <p className="text-muted-foreground">Your AI job search is now active. We'll automatically apply to relevant jobs daily.</p>
                <Button 
                  onClick={handleComplete} 
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
