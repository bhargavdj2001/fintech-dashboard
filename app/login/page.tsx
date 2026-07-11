"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { checkAuthExists, login, register, setToken } from "@/lib/api"
import { Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailExistsWarning, setEmailExistsWarning] = useState(false)

  const handleModeChange = (newMode: "login" | "register") => {
    setMode(newMode)
    setError("")
    setEmailExistsWarning(false)
    setRequiresTotp(false)
  }

  const handleEmailBlur = async () => {
    if (mode !== "register" || !email.trim()) return
    setEmailExistsWarning(false)
    try {
      const r = await checkAuthExists(email.trim())
      if (r.exists) setEmailExistsWarning(true)
    } catch {
      // ignore — don't block the user if the check fails
    }
  }

  const handleSubmit = async () => {
    setError("")
    if (!email.trim() || !password) { setError("Email and password are required"); return }
    setLoading(true)
    try {
      if (mode === "register") {
        await register({ email: email.trim(), password, name: name.trim() || undefined })
      }
      const result = await login({
        email: email.trim(),
        password,
        totp_code: requiresTotp ? totpCode : undefined,
      })
      if (result.requires_totp) {
        setRequiresTotp(true)
        setLoading(false)
        return
      }
      setToken(result.access_token)
      router.push("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      if (msg.startsWith("API 409:")) {
        setError("An account with this email already exists.")
      } else {
        setError(msg.replace(/^API \d+: /, ""))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>
              {requiresTotp
                ? "Two-factor authentication"
                : mode === "register"
                ? "Create account"
                : "Sign in"}
            </CardTitle>
            <CardDescription>
              {requiresTotp
                ? "Enter the code from your authenticator app"
                : mode === "register"
                ? "Create a new FinancialOS account"
                : "Welcome back to FinancialOS"}
            </CardDescription>
          </div>
          {!requiresTotp && (
            <div className="flex overflow-hidden rounded-lg border border-border text-sm">
              <button
                type="button"
                className={`flex-1 py-1.5 transition-colors ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => handleModeChange("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 transition-colors ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => handleModeChange("register")}
              >
                Create Account
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {requiresTotp ? (
            <div className="space-y-2">
              <Label>Authentication Code</Label>
              <Input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoFocus
              />
            </div>
          ) : (
            <>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label>Name (optional)</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailExistsWarning(false) }}
                  onBlur={handleEmailBlur}
                  placeholder="you@example.com"
                />
                {emailExistsWarning && (
                  <p className="text-xs text-warning">
                    An account with this email already exists.{" "}
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => handleModeChange("login")}
                    >
                      Sign in instead?
                    </button>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Please wait..."
              : requiresTotp
              ? "Verify"
              : mode === "register"
              ? "Create Account"
              : "Sign In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
