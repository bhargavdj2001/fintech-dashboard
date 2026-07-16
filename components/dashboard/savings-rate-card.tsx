"use client"

import { useEffect, useState } from "react"
import { fetchDashboardSummary } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { TrendingUp, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const TARGET_RATE = 30

export function SavingsRateCard() {
  const { format } = useCurrency()
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlySavings, setMonthlySavings] = useState(0)

  useEffect(() => {
    fetchDashboardSummary()
      .then((s) => {
        setMonthlyIncome(s.monthly_income)
        setMonthlySavings(s.monthly_income - s.monthly_expense)
      })
      .catch(console.error)
  }, [])

  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Savings Rate
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {savingsRate.toFixed(0)}%
          </span>
          <span className="text-sm text-muted-foreground">of income</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress to {TARGET_RATE}% target</span>
            <span className="font-medium text-foreground">{Math.min(100, (savingsRate / TARGET_RATE) * 100).toFixed(0)}%</span>
          </div>
          <Progress value={Math.max(0, Math.min(100, (savingsRate / TARGET_RATE) * 100))} className="h-2" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            {format(monthlySavings)} saved this month
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
