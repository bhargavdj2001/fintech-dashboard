"use client"

import { useEffect, useState } from "react"
import { fetchDashboardSummary, fetchRecurringRules } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MonthlyForecast() {
  const { format } = useCurrency()
  const [expectedIncome, setExpectedIncome] = useState(0)
  const [expectedExpenses, setExpectedExpenses] = useState(0)
  const [upcomingBills, setUpcomingBills] = useState(0)

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchRecurringRules()])
      .then(([summary, rules]) => {
        setExpectedIncome(summary.monthly_income)
        setExpectedExpenses(summary.monthly_expense)
        const billsTotal = rules
          .filter((r) => r.is_active)
          .reduce((acc, r) => {
            const tmpl = r.template_txn as { amount?: number; type?: string } | null
            return tmpl?.type === "expense" && tmpl.amount ? acc + tmpl.amount : acc
          }, 0)
        setUpcomingBills(billsTotal)
      })
      .catch(console.error)
  }, [])

  const today = new Date()
  const daysRemaining = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate()
  const projectedBalance = expectedIncome - expectedExpenses
  const balanceStatus = projectedBalance > 0 ? "positive" : projectedBalance < 0 ? "negative" : "neutral"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Monthly Forecast</CardTitle>
          <CardDescription>{daysRemaining} days remaining</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Income This Month</span>
            <span className="text-sm font-medium text-success">
              {format(expectedIncome, { signDisplay: "always" })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expenses This Month</span>
            <span className="text-sm font-medium text-destructive">
              {format(-expectedExpenses, { signDisplay: "always" })}
            </span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Net Cashflow</span>
              <div className="flex items-center gap-2">
                {balanceStatus === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : balanceStatus === "negative" ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-lg font-bold ${
                    balanceStatus === "positive"
                      ? "text-success"
                      : balanceStatus === "negative"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {format(Math.abs(projectedBalance))}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Recurring Bills</span>
            <span className="font-medium text-foreground">{format(upcomingBills)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
