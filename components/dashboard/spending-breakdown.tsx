"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const spendingData = [
  { category: "Housing", amount: 2400, color: "var(--chart-1)" },
  { category: "Food", amount: 1200, color: "var(--chart-2)" },
  { category: "Transport", amount: 800, color: "var(--chart-3)" },
  { category: "Entertainment", amount: 600, color: "var(--chart-4)" },
  { category: "Utilities", amount: 400, color: "var(--chart-5)" },
  { category: "Other", amount: 500, color: "var(--muted)" },
]

export function SpendingBreakdown() {
  const total = spendingData.reduce((acc, item) => acc + item.amount, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
        <CardDescription>This month breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-[140px] w-[140px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="amount"
                  strokeWidth={0}
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">${total.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {spendingData.slice(0, 5).map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
                <span className="text-xs font-medium text-foreground tabular-nums">
                  ${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
