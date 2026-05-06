"use client"

import type React from "react"

import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authAPI } from "@/lib/api"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get("token") || "")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await authAPI.resetPassword(token, password, confirmPassword)
      setSuccess("Password reset successfully. Redirecting to sign in...")
      setTimeout(() => router.push("/login"), 1200)
    } catch (err: any) {
      setError(err.message || "Could not reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Choose New Password" subtitle="Create a new password for your JobeerAI account">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Reset Token</label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Reset token" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
          />
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || !token}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary hover:text-primary/80 transition font-semibold">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
