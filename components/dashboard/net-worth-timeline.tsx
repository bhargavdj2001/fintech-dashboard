"use client"

import { useEffect, useState } from "react"
import { fetchAccounts } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const TYPE_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  investment: "Investment",
  credit: "Credit",
}

const chartConfig = {
  balance: { label: "Balance", color: "var(--chart-1)" },
} satisfies ChartConfig

export function NetWorthTimeline() {
  const { format, formatCompact } = useCurrency()
  const [data, setData] = useState<{ type: string; balance: number }[]>([])
  const [netWorth, setNetWorth] = useState(0)

  useEffect(() => {
    fetchAccounts()
      .then((accounts) => {
        const byType = new Map<string, number>()
        for (const a of accounts) {
          const balance = a.type === "credit" ? -Math.abs(a.current_balance) : a.current_balance
          byType.set(a.type, (byType.get(a.type) ?? 0) + balance)
        }
        setData(Array.from(byType.entries()).map(([type, balance]) => ({ type: TYPE_LABEL[type] ?? type, balance })))
        setNetWorth(accounts.reduce((acc, a) => acc + (a.type === "credit" ? -Math.abs(a.current_balance) : a.current_balance), 0))
      })
      .catch(console.error)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Net Worth Breakdown</CardTitle>
            <CardDescription>By account type — current snapshot</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{format(netWorth)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} className="fill-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} tickFormatter={(v) => formatCompact(v)} className="fill-muted-foreground" />
              <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.3 }} content={<ChartTooltipContent />} />
              <Bar dataKey="balance" fill="var(--color-balance)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
