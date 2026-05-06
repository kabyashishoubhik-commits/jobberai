import { NavHeader } from "@/components/nav-header"
import { Footer } from "@/components/footer"
import { PricingSection } from "@/components/pricing-section"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="pt-16">
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
