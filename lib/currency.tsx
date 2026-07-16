"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { fetchSettings } from "@/lib/api"

const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  INR: "en-IN",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
}

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
}

export function currencySymbol(currency: string = "INR"): string {
  return CURRENCY_SYMBOL[currency] ?? currency
}

/** Compact axis-tick formatter, e.g. ₹12k — for chart ticks, not money displays. */
export function formatCompact(amount: number, currency: string = "INR"): string {
  if (!Number.isFinite(amount)) return "—"
  return `${currencySymbol(currency)}${(amount / 1000).toFixed(0)}k`
}

export function formatCurrency(amount: number, currency: string = "INR", opts?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(amount)) return "—"
  const locale = CURRENCY_LOCALE[currency] ?? "en-IN"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
    ...opts,
  }).format(amount)
}

interface CurrencyContextValue {
  currency: string
  format: (amount: number, opts?: Intl.NumberFormatOptions) => string
  formatCompact: (amount: number) => string
  symbol: string
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "INR",
  format: (amount, opts) => formatCurrency(amount, "INR", opts),
  formatCompact: (amount) => formatCompact(amount, "INR"),
  symbol: currencySymbol("INR"),
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("INR")

  useEffect(() => {
    fetchSettings()
      .then((s) => setCurrency(s.default_currency))
      .catch(() => {})
  }, [])

  const value: CurrencyContextValue = {
    currency,
    format: (amount, opts) => formatCurrency(amount, currency, opts),
    formatCompact: (amount) => formatCompact(amount, currency),
    symbol: currencySymbol(currency),
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
