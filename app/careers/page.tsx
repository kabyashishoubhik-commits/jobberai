import { NavHeader } from "@/components/nav-header"
import { Footer } from "@/components/footer"

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Careers at JobeerAI</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We are not hiring for public roles right now, but this page exists so company navigation never drops users into a 404.
          </p>
          <div className="rounded-lg border border-border/20 p-6 bg-card/50">
            <h2 className="font-semibold mb-2">Future Roles</h2>
            <p className="text-sm text-muted-foreground">
              Product engineering, automation reliability, resume intelligence, and customer success roles will be listed here when available.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
