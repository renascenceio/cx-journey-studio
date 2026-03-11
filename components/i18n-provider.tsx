"use client"

import { NextIntlClientProvider } from "next-intl"
import { type ReactNode } from "react"

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  // NextIntlClientProvider automatically gets locale and messages from the server request config
  return (
    <NextIntlClientProvider timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  )
}
