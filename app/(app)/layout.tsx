import { AppTopbar } from "@/components/app-topbar"
import { SoundProvider } from "@/components/sound-provider"

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
      </div>
    </SoundProvider>
  )
}
