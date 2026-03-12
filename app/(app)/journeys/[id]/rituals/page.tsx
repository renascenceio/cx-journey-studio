"use client"

import { useTranslations } from "next-intl"
import { RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function RitualsPage() {
  const t = useTranslations("journey")

  const handleNotifyMe = () => {
    // In a real implementation, this would subscribe the user to updates
    toast.success("We'll notify you when Rituals is available!")
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full text-center border-dashed">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
            <RefreshCw className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          
          <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 mb-4">
            {t("comingSoon")}
          </span>
          
          <h2 className="text-xl font-semibold mb-3">{t("rituals")}</h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {t("ritualsDescription")}
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleNotifyMe}
          >
            <Bell className="h-3.5 w-3.5" />
            {t("notifyMe")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
