"use client"

import { NextIntlClientProvider } from "next-intl"
import { type ReactNode } from "react"
import { type AbstractIntlMessages } from "next-intl"

interface I18nProviderProps {
  children: ReactNode
  locale: string
  messages: AbstractIntlMessages
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  )
}
