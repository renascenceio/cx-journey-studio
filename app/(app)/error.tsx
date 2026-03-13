"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, LogIn, RefreshCw, Home } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[v0] App error:", error)
  }, [error])

  // Check if this is likely an auth-related error
  const isAuthError = 
    error.message?.toLowerCase().includes("auth") ||
    error.message?.toLowerCase().includes("session") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("unauthenticated") ||
    error.message?.toLowerCase().includes("not authenticated") ||
    error.message?.toLowerCase().includes("jwt") ||
    error.message?.toLowerCase().includes("token") ||
    error.message?.toLowerCase().includes("user") ||
    // Generic client-side errors during logout
    error.message?.toLowerCase().includes("null") ||
    error.message?.toLowerCase().includes("undefined")

  if (isAuthError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <LogIn className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xl">Session Expired</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your session has expired or you have been logged out. Please sign in again to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push("/login")}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Generic error fallback
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something Went Wrong</CardTitle>
          <CardDescription className="text-muted-foreground">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Error ID: {error.digest || "Unknown"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
