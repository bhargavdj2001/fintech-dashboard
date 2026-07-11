"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  ArrowRight,
  Clock,
} from "lucide-react"
import { useCurrency } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  fetchInsights,
  fetchTransactions,
  fetchGoals,
  fetchRecurringRules,
  type Insight,
  type Transaction,
  type Goal,
  type RecurringRule,
} from "@/lib/api"

const TYPE_STYLE: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  alert: { icon: AlertTriangle, color: "text-warning", bgColor: "bg-warning/10" },
  anomaly: { icon: AlertTriangle, color: "text-warning", bgColor: "bg-warning/10" },
  positive: { icon: TrendingUp, color: "text-success", bgColor: "bg-success/10" },
  goal: { icon: Target, color: "text-primary", bgColor: "bg-primary/10" },
  opportunity: { icon: Lightbulb, color: "text-primary", bgColor: "bg-primary/10" },
  forecast: { icon: TrendingDown, color: "text-chart-2", bgColor: "bg-chart-2/10" },
}

const chartConfig = {
  rate: { label: "Savings Rate", color: "var(--chart-1)" },
  amount: { label: "Spending", color: "var(--chart-4)" },
} satisfies ChartConfig

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function InsightsPage() {
  const { format, formatCompact } = useCurrency()
  const [insights, setInsights] = useState<Insight[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchInsights(),
      fetchTransactions({ limit: 500 }),
      fetchGoals(),
      fetchRecurringRules(),
    ])
      .then(([insightsData, txnsRes, goalsData, rulesData]) => {
        setInsights(insightsData)
        setTransactions(txnsRes.items)
        setGoals(goalsData)
        setRecurringRules(rulesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Savings rate by month, computed from real transactions.
  const savingsData = useMemo(() => {
    const byMonth = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      const key = t.occurred_at.slice(0, 7) // YYYY-MM
      const entry = byMonth.get(key) ?? { income: 0, expense: 0 }
      if (t.type === "income") entry.income += t.amount
      else if (t.type === "expense") entry.expense += t.amount
      byMonth.set(key, entry)
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, { income, expense }]) => ({
        month: new Date(`${key}-01`).toLocaleDateString("en-US", { month: "short" }),
        rate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
      }))
  }, [transactions])

  // Spending by weekday over the last 7 days.
  const weeklySpending = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const byDay = new Array(7).fill(0)
    for (const t of transactions) {
      if (t.type !== "expense") continue
      const d = new Date(t.occurred_at)
      if (d < sevenDaysAgo || d > now) continue
      byDay[d.getDay()] += t.amount
    }
    return WEEKDAY_LABELS.map((day, i) => ({ day, amount: byDay[i] }))
  }, [transactions])

  // Category spending this month vs last month.
  const spendingTrends = useMemo(() => {
    const now = new Date()
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const current = new Map<string, number>()
    const previous = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== "expense") continue
      const name = t.category?.name ?? "Uncategorized"
      const d = new Date(t.occurred_at)
      if (d >= curStart) current.set(name, (current.get(name) ?? 0) + t.amount)
      else if (d >= prevStart && d <= prevEnd) previous.set(name, (previous.get(name) ?? 0) + t.amount)
    }
    const categories = new Set([...current.keys(), ...previous.keys()])
    return Array.from(categories)
      .map((category) => {
        const cur = current.get(category) ?? 0
        const prev = previous.get(category) ?? 0
        const change = prev > 0 ? ((cur - prev) / prev) * 100 : 0
        return { category, current: cur, previous: prev, change }
      })
      .filter((t) => t.current > 0 || t.previous > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 4)
  }, [transactions])

  const maxTrendAmount = Math.max(1, ...spendingTrends.map((t) => t.current))

  const activeRecurringRules = recurringRules.filter((r) => r.is_active)
  const totalRecurringMonthly = activeRecurringRules.reduce(
    (acc, r) => acc + (Number(r.template_txn?.amount) || 0),
    0
  )

  const goalsOnTrack = goals.filter((g) => g.status === "on-track" || g.status === "completed").length
  const alertCount = insights.filter((i) => i.priority === "high").length
  const currentMonthRate = savingsData.length > 0 ? savingsData[savingsData.length - 1].rate : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Insights</h1>
          <p className="text-sm text-muted-foreground">
            Rule-based analysis and recommendations computed from your real data
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold text-foreground">{currentMonthRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goals on Track</p>
                <p className="text-2xl font-bold text-foreground">{goalsOnTrack}/{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High-Priority Alerts</p>
                <p className="text-2xl font-bold text-foreground">{alertCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Sparkles className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-2xl font-bold text-foreground">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Insights</CardTitle>
            </div>
            <CardDescription>Computed from your transactions, budgets, and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loading && insights.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No insights yet — insights build up as you log transactions and budgets.
              </p>
            )}
            {insights.map((insight) => {
              const style = TYPE_STYLE[insight.type] ?? TYPE_STYLE.alert
              return (
                <div
                  key={insight.id}
                  className="flex gap-4 rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${style.bgColor}`}>
                    <style.icon className={`h-5 w-5 ${style.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{insight.title}</p>
                        <Badge
                          variant="secondary"
                          className={`mt-1 ${
                            insight.priority === "high"
                              ? "bg-destructive/10 text-destructive"
                              : insight.priority === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {insight.priority} priority
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && insight.action_href && (
                      <Button variant="link" className="mt-2 h-auto p-0 text-primary" asChild>
                        <Link href={insight.action_href}>
                          {insight.action}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Savings Rate Trend</CardTitle>
              <CardDescription>Your monthly savings percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {savingsData.length < 2 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Not enough history yet to chart a trend.
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <LineChart data={savingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="var(--color-rate)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-rate)", strokeWidth: 0, r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Weekly Spending Pattern</CardTitle>
              <CardDescription>Your spending by day, last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[180px] w-full">
                <BarChart data={weeklySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Spending Trends</CardTitle>
            <CardDescription>Compared to last month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {spendingTrends.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No spending recorded yet.</p>
            ) : (
              spendingTrends.map((trend) => (
                <div key={trend.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{trend.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {format(trend.current)}
                      </span>
                      {trend.previous > 0 && (
                        <span
                          className={`flex items-center text-xs font-medium ${
                            trend.change > 0 ? "text-destructive" : "text-success"
                          }`}
                        >
                          {trend.change > 0 ? (
                            <TrendingUp className="mr-0.5 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-0.5 h-3 w-3" />
                          )}
                          {Math.abs(trend.change).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${trend.change > 0 ? "bg-destructive" : "bg-success"}`}
                      style={{ width: `${Math.min((trend.current / maxTrendAmount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Financial Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No goals yet.</p>
            ) : (
              goals.map((goal) => {
                const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{goal.name}</p>
                          {goal.target_date && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(goal.current_amount)} of {format(goal.target_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recurring Payments</CardTitle>
            <CardDescription>Active recurring rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRecurringRules.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No active recurring payments.</p>
            ) : (
              <>
                {activeRecurringRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {String(rule.template_txn?.title ?? "Recurring payment")}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{rule.freq}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {format(Number(rule.template_txn?.amount) || 0)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total per period</span>
                    <span className="text-lg font-bold text-foreground">{format(totalRecurringMonthly)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
