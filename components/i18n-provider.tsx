"use client"

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl"
import { type ReactNode } from "react"

interface I18nProviderProps {
  children: ReactNode
  locale: string
  messages: AbstractIntlMessages
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  console.log("[v0] I18nProvider - locale:", locale)
  console.log("[v0] I18nProvider - messages type:", typeof messages)
  console.log("[v0] I18nProvider - messages keys:", messages ? Object.keys(messages) : "null")
  
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
