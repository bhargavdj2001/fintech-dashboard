"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", income: 8500, expenses: 6200 },
  { month: "Feb", income: 9200, expenses: 5800 },
  { month: "Mar", income: 8800, expenses: 7100 },
  { month: "Apr", income: 9500, expenses: 6400 },
  { month: "May", income: 10200, expenses: 7200 },
  { month: "Jun", income: 9800, expenses: 6800 },
  { month: "Jul", income: 11000, expenses: 7500 },
  { month: "Aug", income: 10500, expenses: 6900 },
  { month: "Sep", income: 9900, expenses: 7100 },
  { month: "Oct", income: 10800, expenses: 7400 },
  { month: "Nov", income: 11200, expenses: 7800 },
  { month: "Dec", income: 12500, expenses: 9200 },
]

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function CashflowChart() {
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
                ${(totalIncome / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-chart-4" />
              <span className="text-xs text-muted-foreground">Expenses</span>
              <span className="text-sm font-semibold text-foreground">
                ${(totalExpenses / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(value) => `$${value / 1000}k`}
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
      </CardContent>
    </Card>
  )
}
