import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GridScan } from "./GridScan"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-10">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#392e4e"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/20 backdrop-blur">
          <span className="w-2 h-2 bg-accent rounded-full" />
          <span className="text-xs sm:text-sm text-muted-foreground">Powered by AI Agents</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
          Automate Your Job Search.
          <br />
          <span className="gradient-text">Get 3x More Interviews.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload your resume, choose your role, and press start. AI agents auto-apply to jobs daily, email recruiters, and optimize your CV for maximum results.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="bg-primary" asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
