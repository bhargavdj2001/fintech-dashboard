"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const budgets = [
  { category: "Food & Dining", spent: 980, budget: 1200, color: "bg-chart-1" },
  { category: "Transportation", spent: 420, budget: 500, color: "bg-chart-2" },
  { category: "Entertainment", spent: 380, budget: 400, color: "bg-chart-3" },
  { category: "Shopping", spent: 650, budget: 600, color: "bg-chart-4" },
  { category: "Utilities", spent: 180, budget: 300, color: "bg-chart-5" },
]

export function BudgetProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Budget Progress</CardTitle>
        <CardDescription>Track your monthly spending limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => {
          const percentage = Math.min((budget.spent / budget.budget) * 100, 100)
          const isOverBudget = budget.spent > budget.budget

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{budget.category}</span>
                <span
                  className={`tabular-nums ${
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  ${budget.spent} / ${budget.budget}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOverBudget ? "bg-destructive" : budget.color
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
