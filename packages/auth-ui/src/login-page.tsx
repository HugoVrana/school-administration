import type { FormEvent } from "react"
import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router"
import { useAuth, useSignIn } from "@clerk/react-router"
import { Button } from "@workspace/ui/components/base/button"
import { Input } from "@workspace/ui/components/base/input"

type Step = "credentials" | "verify"

export type LoginPageProps = {
  afterSignInPath?: string
  registerPath?: string
}

export function LoginPage({
  afterSignInPath = "/",
  registerPath = "/register",
}: LoginPageProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { signIn } = useSignIn()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<Step>("credentials")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isLoaded) return null
  if (isSignedIn) return <Navigate to={afterSignInPath} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const { error: passwordError } = await signIn.password({
        identifier: email,
        password,
      })
      if (passwordError) {
        setError(passwordError.message)
        return
      }

      await continueSignIn()
    } catch (err) {
      setError(getErrorMessage(err, "Sign in failed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code })
      if (verifyError) {
        setError(verifyError.message)
        return
      }

      await continueSignIn()
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed"))
    } finally {
      setLoading(false)
    }
  }

  async function continueSignIn() {
    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize()
      if (finalizeError) {
        setError(finalizeError.message)
        return
      }

      navigate(afterSignInPath)
      return
    }

    if (
      signIn.status === "needs_client_trust" ||
      signIn.status === "needs_second_factor"
    ) {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      )

      if (!emailCodeFactor) {
        setError("This account requires an unsupported second factor.")
        return
      }

      const { error: sendError } = await signIn.mfa.sendEmailCode()
      if (sendError) {
        setError(sendError.message)
        return
      }

      setStep("verify")
      return
    }

    setError(`Sign-in is not complete yet: ${signIn.status}`)
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        {step === "credentials" ? (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-medium">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <p className="text-center text-xs text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to={registerPath}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-medium">Verify your account</h1>
              <p className="text-sm text-muted-foreground">
                Enter the code sent to your email
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <Input
                placeholder="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="one-time-code"
                aria-label="Verification code"
              />

              {error && (
                <p className="text-center text-xs text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Wrong account?{" "}
              <button
                type="button"
                onClick={() => {
                  signIn.reset()
                  setCode("")
                  setError(null)
                  setStep("credentials")
                }}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Start over
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    if (
      "errors" in error &&
      Array.isArray(error.errors) &&
      typeof error.errors[0]?.message === "string"
    ) {
      return error.errors[0].message
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message
    }
  }

  return fallback
}
