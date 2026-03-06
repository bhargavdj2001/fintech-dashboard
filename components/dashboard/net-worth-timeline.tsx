"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const netWorthData = [
  { month: "Jan '23", netWorth: 185000, assets: 210000, liabilities: 25000 },
  { month: "Apr '23", netWorth: 192000, assets: 220000, liabilities: 28000 },
  { month: "Jul '23", netWorth: 205000, assets: 235000, liabilities: 30000 },
  { month: "Oct '23", netWorth: 218000, assets: 250000, liabilities: 32000 },
  { month: "Jan '24", netWorth: 228000, assets: 262000, liabilities: 34000 },
  { month: "Apr '24", netWorth: 235000, assets: 275000, liabilities: 40000 },
  { month: "Jul '24", netWorth: 242000, assets: 290000, liabilities: 48000 },
  { month: "Oct '24", netWorth: 248750, assets: 312500, liabilities: 63750 },
]

const chartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-1)",
  },
  assets: {
    label: "Assets",
    color: "var(--chart-2)",
  },
  liabilities: {
    label: "Liabilities",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function NetWorthTimeline() {
  const startValue = netWorthData[0].netWorth
  const endValue = netWorthData[netWorthData.length - 1].netWorth
  const growth = ((endValue - startValue) / startValue) * 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Net Worth History</CardTitle>
            <CardDescription>Track your wealth over time</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">${endValue.toLocaleString()}</p>
            <p className="text-xs text-success">+{growth.toFixed(1)}% all time</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            data={netWorthData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              tickFormatter={(value) => `$${value / 1000}k`}
              className="fill-muted-foreground"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="var(--color-netWorth)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
