import { NavHeader } from "@/components/nav-header"
import { Footer } from "@/components/footer"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Security</h1>
          <p className="text-lg text-muted-foreground mb-8">
            JobeerAI runs locally in this project. Keep API keys in environment variables and use visible browser login for Google, OTP, and CAPTCHA prompts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["Secrets", "Do not commit real API keys or job-board passwords. Use .env.local on your machine."],
              ["Automation", "The browser flow does not bypass security checks. Complete sensitive steps manually."],
              ["Credentials", "Saved job-board credentials are stored in the local SQLite database for this development build."],
              ["Sessions", "Close visible browser sessions from the automation page when a run is complete."],
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
