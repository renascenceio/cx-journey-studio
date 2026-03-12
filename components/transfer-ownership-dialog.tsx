"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, User, Mail, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TransferOwnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetType: "workspace" | "journey" | "archetype"
  assetId: string
  assetName: string
  onTransferred?: () => void
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  assetType,
  assetId,
  assetName,
  onTransferred,
}: TransferOwnershipDialogProps) {
  const t = useTranslations()
  const [method, setMethod] = useState<"member" | "email">("member")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [previousOwnerRole, setPreviousOwnerRole] = useState("contributor")
  const [submitting, setSubmitting] = useState(false)

  // Fetch workspace members if transferring within workspace
  const { data: members = [] } = useSWR<Array<{ id: string; full_name: string; email: string; role: string }>>(
    open && method === "member" ? "/api/workspace-members" : null,
    fetcher
  )

  const handleTransfer = async () => {
    if (method === "member" && !selectedUserId) {
      toast.error(t("transfer.selectRecipient"))
      return
    }
    if (method === "email" && !email.trim()) {
      toast.error(t("transfer.enterEmail"))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetType,
          assetId,
          assetName,
          toUserId: method === "member" ? selectedUserId : undefined,
          toEmail: method === "email" ? email.trim() : undefined,
          message: message.trim() || undefined,
          previousOwnerRole,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(t("transfer.requestSent"))
        onOpenChange(false)
        onTransferred?.()
        // Reset form
        setSelectedUserId("")
        setEmail("")
        setMessage("")
      } else {
        toast.error(data.error || t("transfer.failed"))
      }
    } catch {
      toast.error(t("transfer.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  const assetTypeLabel = {
    workspace: t("transfer.types.workspace"),
    journey: t("transfer.types.journey"),
    archetype: t("transfer.types.archetype"),
  }[assetType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            {t("transfer.title")}
          </DialogTitle>
          <DialogDescription>
            {t("transfer.description", { type: assetTypeLabel, name: assetName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Warning banner */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("transfer.warning")}
            </p>
          </div>

          {/* Transfer method toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={method === "member" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setMethod("member")}
            >
              <User className="h-3.5 w-3.5" />
              {t("transfer.toMember")}
            </Button>
            <Button
              variant={method === "email" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setMethod("email")}
            >
              <Mail className="h-3.5 w-3.5" />
              {t("transfer.toEmail")}
            </Button>
          </div>

          {/* Recipient selection */}
          {method === "member" ? (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">{t("transfer.selectMember")}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("transfer.selectMemberPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.full_name || m.email}</span>
                        <Badge variant="outline" className="text-[9px]">{m.role}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">{t("transfer.recipientEmail")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                {t("transfer.emailNote")}
              </p>
            </div>
          )}

          {/* Role for previous owner */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs">{t("transfer.yourRoleAfter")}</Label>
            <Select value={previousOwnerRole} onValueChange={setPreviousOwnerRole}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                <SelectItem value="project_manager">{t("roles.project_manager")}</SelectItem>
                <SelectItem value="contributor">{t("roles.contributor")}</SelectItem>
                <SelectItem value="viewer">{t("roles.viewer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional message */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">{t("transfer.message")} ({t("common.optional")})</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("transfer.messagePlaceholder")}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleTransfer} disabled={submitting} className="gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {submitting ? t("transfer.sending") : t("transfer.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
