"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Download, Trash2, Eye } from "lucide-react"
import { useState } from "react"
import { resumeAPI } from "@/lib/api"

export default function ResumesPage() {
  const [resumes, setResumes] = useState([
    {
      id: 1,
      name: "resume-v1.pdf",
      uploadDate: "2 days ago",
      size: "245 KB",
      active: true,
    },
    {
      id: 2,
      name: "resume-v2.pdf",
      uploadDate: "1 week ago",
      size: "218 KB",
      active: false,
    },
    {
      id: 3,
      name: "resume-tech-focus.pdf",
      uploadDate: "2 weeks ago",
      size: "256 KB",
      active: false,
    },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError("")
      const data = await resumeAPI.upload(file)
      // Add to resumes list
      setResumes([
        {
          id: resumes.length + 1,
          name: file.name,
          uploadDate: "just now",
          size: `${Math.round(file.size / 1024)} KB`,
          active: false,
        },
        ...resumes,
      ])
    } catch (err: any) {
      setError(err.message || "Failed to upload resume")
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
          <h1 className="text-2xl font-bold mb-6">Resume Library</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Upload Section */}
          <Card className="p-8 glassmorphic border-border/20 mb-6 border-2 border-dashed">
            <div className="flex items-center justify-center flex-col text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-1">Upload New Resume</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Drag and drop your resume or click to browse (PDF or DOC)
              </p>
              <label htmlFor="resume-upload">
                <Button asChild disabled={loading}>
                  <span>{loading ? "Uploading..." : "Choose File"}</span>
                </Button>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </Card>

          {/* Resume List */}
          <div className="space-y-3">
            {resumes.length === 0 ? (
              <Card className="p-12 glassmorphic border-border/20 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Resumes Uploaded</h3>
                <p className="text-muted-foreground">Upload your first resume to get started</p>
              </Card>
            ) : (
              resumes.map((resume) => (
                <Card key={resume.id} className="p-4 glassmorphic border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{resume.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {resume.uploadDate} • {resume.size}
                        </p>
                      </div>
                      {resume.active && (
                        <Badge className="ml-auto">Active</Badge>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Tips Section */}
          <Card className="p-6 glassmorphic border-border/20 mt-8 bg-primary/5">
            <h3 className="font-semibold mb-3">Tips for Better Results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Use different resumes for different roles</li>
              <li>✓ Optimize keywords matching job descriptions</li>
              <li>✓ Keep file size under 5MB</li>
              <li>✓ Update regularly to reflect new skills</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
