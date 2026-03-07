"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api"

export function QuickStats() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    fetchDashboardSummary().then(setSummary).catch(console.error)
  }, [])

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const stats = summary
    ? [
        {
          label: "Total Balance",
          value: fmt(summary.total_balance),
          change: "",
          trend: "up" as const,
          icon: Wallet,
        },
        {
          label: "Monthly Income",
          value: fmt(summary.monthly_income),
          change: "",
          trend: "up" as const,
          icon: ArrowDownLeft,
        },
        {
          label: "Monthly Expenses",
          value: fmt(summary.monthly_expense),
          change: "",
          trend: "down" as const,
          icon: ArrowUpRight,
        },
        {
          label: "Net Cashflow",
          value: fmt(summary.net_cashflow),
          change: "",
          trend: summary.net_cashflow >= 0 ? ("up" as const) : ("down" as const),
          icon: CreditCard,
        },
      ]
    : [
        { label: "Total Balance", value: "—", change: "", trend: "up" as const, icon: Wallet },
        { label: "Monthly Income", value: "—", change: "", trend: "up" as const, icon: ArrowDownLeft },
        { label: "Monthly Expenses", value: "—", change: "", trend: "down" as const, icon: ArrowUpRight },
        { label: "Net Cashflow", value: "—", change: "", trend: "up" as const, icon: CreditCard },
      ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              {stat.change && (
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    stat.trend === "up" && stat.label !== "Monthly Expenses"
                      ? "bg-success/10 text-success"
                      : stat.trend === "down" && stat.label === "Monthly Expenses"
                      ? "bg-success/10 text-success"
                      : stat.trend === "down" && stat.label === "Net Cashflow"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {stat.change}
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
