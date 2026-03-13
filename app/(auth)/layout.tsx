import { getSiteLogos } from "@/lib/get-site-logos"
import { AuthLayoutClient } from "@/components/auth-layout-client"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const logos = await getSiteLogos()

  return (
    <AuthLayoutClient 
      // Use login-specific logos if available, otherwise fall back to regular logos
      logoDark={logos.loginLogoDark || logos.logoDark}
      logoLight={logos.loginLogoLight || logos.logoLight}
      siteName={logos.siteName}
    >
      {children}
    </AuthLayoutClient>
  )
}
