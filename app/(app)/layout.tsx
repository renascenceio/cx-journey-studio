import { AppTopbar } from "@/components/app-topbar"
import { SoundProvider } from "@/components/sound-provider"
import { SupportWidget } from "@/components/support-widget"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No client-side auth check - middleware handles all protection
  // This prevents spinner issues caused by auth initialization delays
  return (
    <SoundProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppTopbar />
        <main className="flex-1">{children}</main>
        <SupportWidget />
      </div>
    </SoundProvider>
  )
}
