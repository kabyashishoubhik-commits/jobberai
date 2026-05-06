import { NavHeader } from "@/components/nav-header"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">About JobeerAI</h1>
          <p className="text-lg text-muted-foreground mb-8">
            JobeerAI helps job seekers manage applications, resumes, outreach, and browser-assisted job board workflows from one dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ["Focused", "Built for repeatable job-search work, not a marketing splash screen."],
              ["Practical", "Supports saved credentials and manual browser login for sites that require Google, OTP, or CAPTCHA."],
              ["Trackable", "Keeps applications, sources, resume activity, and analytics in one place."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border/20 p-5 bg-card/50">
                <h2 className="font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
