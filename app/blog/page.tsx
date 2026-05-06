import { NavHeader } from "@/components/nav-header"
import { Footer } from "@/components/footer"

const posts = [
  {
    title: "How to Use Browser Takeover for Naukri",
    excerpt: "Open the visible browser, complete Gmail or OTP login, then let automation continue with your uploaded resume.",
  },
  {
    title: "Building a Realistic Application Pipeline",
    excerpt: "Track job source, resume version, reply rate, and interview rate so high-volume applying still stays measurable.",
  },
  {
    title: "When to Use Manual Review",
    excerpt: "Use manual review for long forms, security prompts, or applications that need custom answers before submission.",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold mb-4">JobeerAI Blog</h1>
          <p className="text-lg text-muted-foreground mb-8">Practical notes for job-search automation and application tracking.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.title} className="rounded-lg border border-border/20 p-5 bg-card/50">
                <h2 className="font-semibold mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
