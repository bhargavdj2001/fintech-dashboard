"use client"

import { useEffect, useState } from "react"
import { fetchBudgets, type Budget } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function BudgetProgress() {
  const { format } = useCurrency()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgets()
      .then(setBudgets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Budget Progress</CardTitle>
        <CardDescription>Track your monthly spending limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets set yet.</p>
        ) : (
          budgets.slice(0, 5).map((budget, idx) => {
            const percentage = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0
            const isOverBudget = budget.spent > budget.amount

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{budget.category?.name ?? budget.name}</span>
                  <span className={`tabular-nums ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                    {format(budget.spent)} / {format(budget.amount)}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : COLORS[idx % COLORS.length]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
