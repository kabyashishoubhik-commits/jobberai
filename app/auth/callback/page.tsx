"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const authError = params.get("error")

    if (token) {
      localStorage.setItem("authToken", token)
      router.replace("/dashboard")
      return
    }

    setError(authError || "Sign-in did not return a session.")
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-lg border border-border/20 bg-card p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Finishing Sign In</h1>
        {error ? (
          <>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Link href="/login" className="text-primary font-semibold">
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        )}
      </div>
    </main>
  )
}
