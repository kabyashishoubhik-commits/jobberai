"use client"

import type React from "react"

import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authAPI } from "@/lib/api"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [resetLink, setResetLink] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    setResetLink("")

    try {
      const data = await authAPI.forgotPassword(email)
      setMessage(data.message)
      if (data.resetToken) {
        setResetLink(`/reset-password?token=${data.resetToken}`)
      }
    } catch (err: any) {
      setError(err.message || "Could not start password reset")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Reset Password" subtitle="Enter your account email to create a reset link">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{message}</div>}
      {resetLink && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded text-sm">
          Development reset link:{" "}
          <Link href={resetLink} className="font-semibold underline">
            Open reset page
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading ? "Preparing link..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-primary hover:text-primary/80 transition font-semibold">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
