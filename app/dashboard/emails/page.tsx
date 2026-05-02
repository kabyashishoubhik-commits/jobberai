"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Clock, Send, Archive } from "lucide-react"

export default function EmailOutreachPage() {
  const emailCampaigns = [
    {
      id: 1,
      company: "Stripe",
      subject: "Excited about Product Manager role",
      date: "2 days ago",
      status: "sent",
      opened: true,
      replied: false,
    },
    {
      id: 2,
      company: "Vercel",
      subject: "Full Stack Engineer application follow-up",
      date: "4 days ago",
      status: "sent",
      opened: true,
      replied: true,
    },
    {
      id: 3,
      company: "Figma",
      subject: "Design System Lead inquiry",
      date: "1 week ago",
      status: "draft",
      opened: false,
      replied: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Email Outreach</h1>
            <Button className="bg-primary hover:bg-primary/90">
              <Mail className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Sent", value: "12", icon: Send },
              { label: "Opened", value: "8 (67%)", icon: Mail },
              { label: "Replied", value: "3 (25%)", icon: Clock },
              { label: "In Draft", value: "2", icon: Archive },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <Card key={i} className="p-4 glassmorphic border-border/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Email List */}
          <div className="space-y-4">
            {emailCampaigns.map((email) => (
              <Card key={email.id} className="p-6 glassmorphic border-border/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{email.company}</h3>
                      <Badge variant={email.status === "sent" ? "default" : "outline"}>
                        {email.status}
                      </Badge>
                      {email.opened && <Badge variant="secondary">Opened</Badge>}
                      {email.replied && <Badge className="bg-green-100 text-green-800">Replied</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">{email.date}</p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {email.status === "draft" ? (
                      <>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Send</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Archive</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Email Template Section */}
          <Card className="p-6 glassmorphic border-border/20 mt-8">
            <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Initial Outreach", count: 5 },
                { name: "Follow-up", count: 3 },
                { name: "Thank You", count: 2 },
              ].map((template, i) => (
                <div key={i} className="p-4 bg-muted/20 rounded-lg">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.count} templates</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
