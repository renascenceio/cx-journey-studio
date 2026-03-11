import { Metadata } from "next"

export const metadata: Metadata = {
  title: "View Journey | Journey Studio",
  description: "View a shared customer journey map",
}

export default function PublicViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
