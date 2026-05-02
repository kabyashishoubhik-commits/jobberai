"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap } from "lucide-react"

export default function BillingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect to get started",
      features: [
        "5 auto-applications per day",
        "Basic job matching",
        "1 resume upload",
        "Limited analytics",
        "Email support",
      ],
      current: true,
      cta: "Current Plan",
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For serious job seekers",
      features: [
        "50 auto-applications per day",
        "Advanced job matching",
        "10 resume uploads",
        "Full analytics dashboard",
        "Email outreach automation",
        "Priority support",
      ],
      current: false,
      cta: "Upgrade to Pro",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Unlimited applications",
        "Custom matching logic",
        "Unlimited resumes",
        "Advanced analytics",
        "Team management",
        "Dedicated account manager",
      ],
      current: false,
      cta: "Contact Sales",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-20 md:ml-64 pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Billing & Plans</h1>
          <p className="text-muted-foreground mb-8">
            Choose the perfect plan for your job search needs
          </p>

          {/* Billing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`p-6 glassmorphic ${
                  plan.current
                    ? "border-primary/50 border-2 ring-2 ring-primary/10"
                    : "border-border/20"
                }`}
              >
                {plan.current && (
                  <Badge className="mb-3 bg-primary">Current Plan</Badge>
                )}

                <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <Button
                  className={`w-full mb-6 ${
                    plan.current
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 glassmorphic border-border/20">
              <h3 className="font-semibold mb-4">Current Month Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Auto-Applications</span>
                    <span className="text-sm font-semibold">42 / 150</span>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "28%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Resume Uploads</span>
                    <span className="text-sm font-semibold">2 / 10</span>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 glassmorphic border-border/20">
              <h3 className="font-semibold mb-4">Billing Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Billing Date</span>
                  <span className="font-medium">May 1, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">Visa ending in 4242</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card className="p-6 glassmorphic border-border/20">
            <h3 className="font-semibold mb-4">Payment Methods</h3>
            <div className="space-y-3">
              <div className="p-4 bg-muted/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
                <Badge>Primary</Badge>
              </div>
              <Button variant="outline">Add Payment Method</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
