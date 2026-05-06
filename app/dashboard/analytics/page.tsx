"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { AnalyticsChart } from "@/components/analytics-chart"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function AnalyticsPage() {
  const conversionData = [
    { stage: "Applications", value: 349 },
    { stage: "Replies", value: 41 },
    { stage: "Interviews", value: 11 },
    { stage: "Offers", value: 2 },
  ]

  const cvPerformance = [
    { name: "Software Resume", applications: 128, replies: 16, interviews: 4 },
    { name: "Product Resume", applications: 94, replies: 12, interviews: 3 },
    { name: "Data Resume", applications: 127, replies: 13, interviews: 4 },
  ]

  const jobSourceData = [
    { name: "LinkedIn", value: 143 },
    { name: "Naukri", value: 121 },
    { name: "Wellfound", value: 64 },
    { name: "Manual", value: 21 },
  ]

  const COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)", "var(--color-chart-4)"]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Analytics</h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Applications", value: "349", change: "+18%" },
              { label: "Email Open Rate", value: "37%", change: "+8%" },
              { label: "Reply Rate", value: "11.7%", change: "+2%" },
              { label: "Interview Rate", value: "3.2%", change: "+0.8%" },
            ].map((metric, i) => (
              <Card key={i} className="p-4 glassmorphic border-border/20">
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <Badge className="text-accent-foreground bg-accent/20 text-accent">{metric.change}</Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Conversion Funnel */}
            <Card className="p-6 glassmorphic border-border/20">
              <h2 className="text-lg font-bold mb-6">Conversion Funnel</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="stage" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Job Sources */}
            <Card className="p-6 glassmorphic border-border/20">
              <h2 className="text-lg font-bold mb-6">Applications by Source</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={jobSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Weekly Trend */}
          <Card className="p-6 glassmorphic border-border/20 mb-6">
            <h2 className="text-lg font-bold mb-6">Weekly Performance</h2>
            <AnalyticsChart />
          </Card>

          {/* CV Performance */}
          <Card className="p-6 glassmorphic border-border/20">
            <h2 className="text-lg font-bold mb-6">CV Performance Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/20">
                  <tr>
                    <th className="text-left py-3 px-4">CV Version</th>
                    <th className="text-left py-3 px-4">Applications</th>
                    <th className="text-left py-3 px-4">Replies</th>
                    <th className="text-left py-3 px-4">Interviews</th>
                    <th className="text-left py-3 px-4">Reply Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {cvPerformance.map((row, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition">
                      <td className="py-3 px-4 font-medium">{row.name}</td>
                      <td className="py-3 px-4">{row.applications}</td>
                      <td className="py-3 px-4">{row.replies}</td>
                      <td className="py-3 px-4">{row.interviews}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-primary/20 text-primary">
                          {((row.replies / row.applications) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
