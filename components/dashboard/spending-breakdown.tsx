"use client"

import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchDashboardSummary } from "@/lib/api"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted)",
]

export function SpendingBreakdown() {
  const [spendingData, setSpendingData] = useState<{ category: string; amount: number; color: string }[]>([])

  useEffect(() => {
    fetchDashboardSummary()
      .then((summary) => {
        const entries = Object.entries(summary.category_breakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([category, amount], i) => ({
            category,
            amount,
            color: COLORS[i % COLORS.length],
          }))
        setSpendingData(entries)
      })
      .catch(console.error)
  }, [])

  const total = spendingData.reduce((acc, item) => acc + item.amount, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
        <CardDescription>This month breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {spendingData.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No spending data this month.</p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative h-35 w-35 shrink-0">
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
        )}
      </CardContent>
    </Card>
  )
}
