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
      logoDark={logos.logoDark}
      logoLight={logos.logoLight}
      siteName={logos.siteName}
    >
      {children}
    </AuthLayoutClient>
  )
}
