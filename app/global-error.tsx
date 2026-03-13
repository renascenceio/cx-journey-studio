"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error:", error)
  }, [error])

  // Check if this is likely an auth-related error
  const isAuthError = 
    error.message?.toLowerCase().includes("auth") ||
    error.message?.toLowerCase().includes("session") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("not authenticated") ||
    error.message?.toLowerCase().includes("null") ||
    error.message?.toLowerCase().includes("undefined")

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#fafafa",
          padding: "1rem"
        }}>
          <div style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              backgroundColor: isAuthError ? "#fef3c7" : "#fee2e2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isAuthError ? "#d97706" : "#dc2626"} strokeWidth="2">
                {isAuthError ? (
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                ) : (
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                )}
              </svg>
            </div>
            
            <h1 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#18181b",
              marginBottom: "0.5rem"
            }}>
              {isAuthError ? "Session Expired" : "Something Went Wrong"}
            </h1>
            
            <p style={{
              fontSize: "0.875rem",
              color: "#71717a",
              marginBottom: "1.5rem",
              lineHeight: "1.5"
            }}>
              {isAuthError 
                ? "Your session has expired or you have been logged out. Please sign in again to continue."
                : "An unexpected error occurred. Please try again or contact support if the problem persists."
              }
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {isAuthError ? (
                <a 
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.625rem 1rem",
                    backgroundColor: "#18181b",
                    color: "white",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    textDecoration: "none"
                  }}
                >
                  Sign In
                </a>
              ) : (
                <button
                  onClick={() => reset()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.625rem 1rem",
                    backgroundColor: "#18181b",
                    color: "white",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Try Again
                </button>
              )}
              
              <a 
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.625rem 1rem",
                  backgroundColor: "white",
                  color: "#18181b",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  textDecoration: "none",
                  border: "1px solid #e4e4e7"
                }}
              >
                Go to Home
              </a>
            </div>
            
            {error.digest && (
              <p style={{
                fontSize: "0.75rem",
                color: "#a1a1aa",
                marginTop: "1rem"
              }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
