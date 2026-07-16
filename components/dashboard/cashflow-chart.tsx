"use client"

import { useEffect, useState } from "react"
import { fetchTransactions } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MonthBucket {
  month: string
  income: number
  expenses: number
}

const chartConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
} satisfies ChartConfig

export function CashflowChart() {
  const { formatCompact } = useCurrency()
  const [chartData, setChartData] = useState<MonthBucket[]>([])

  useEffect(() => {
    fetchTransactions({ limit: 500, offset: 0 })
      .then((res) => {
        const buckets = new Map<string, MonthBucket>()
        for (const txn of res.items) {
          if (txn.type === "transfer") continue
          const date = new Date(txn.occurred_at)
          const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          if (!buckets.has(key)) buckets.set(key, { month: key, income: 0, expenses: 0 })
          const bucket = buckets.get(key)!
          if (txn.type === "income") bucket.income += txn.amount
          else bucket.expenses += txn.amount
        }
        const sorted = Array.from(buckets.values()).sort(
          (a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime()
        )
        setChartData(sorted.slice(-6))
      })
      .catch(console.error)
  }, [])

  const totalIncome = chartData.reduce((acc, item) => acc + item.income, 0)
  const totalExpenses = chartData.reduce((acc, item) => acc + item.expenses, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Cashflow</CardTitle>
            <CardDescription>Income vs Expenses over time</CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
              <span className="text-xs text-muted-foreground">Income</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCompact(totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-chart-4" />
              <span className="text-xs text-muted-foreground">Expenses</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCompact(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No transaction history yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                className="fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => formatCompact(value)}
                className="fill-muted-foreground"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                fill="url(#fillIncome)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expenses)"
                strokeWidth={2}
                fill="url(#fillExpenses)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
