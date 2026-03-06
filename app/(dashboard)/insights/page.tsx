"use client"

import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  PiggyBank,
  ShoppingBag,
  Coffee,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const savingsData = [
  { month: "Jan", rate: 18 },
  { month: "Feb", rate: 22 },
  { month: "Mar", rate: 19 },
  { month: "Apr", rate: 25 },
  { month: "May", rate: 28 },
  { month: "Jun", rate: 24 },
]

const spendingTrends = [
  { category: "Food & Dining", current: 1200, previous: 980, change: 22.4 },
  { category: "Shopping", current: 650, previous: 820, change: -20.7 },
  { category: "Transportation", current: 420, previous: 380, change: 10.5 },
  { category: "Entertainment", current: 380, previous: 450, change: -15.6 },
]

const recurringPayments = [
  { name: "Netflix", amount: 15.99, frequency: "Monthly", detected: "12 months" },
  { name: "Spotify", amount: 9.99, frequency: "Monthly", detected: "8 months" },
  { name: "AWS", amount: 45.0, frequency: "Monthly", detected: "6 months" },
  { name: "Gym Membership", amount: 49.99, frequency: "Monthly", detected: "4 months" },
  { name: "Adobe Creative Cloud", amount: 54.99, frequency: "Monthly", detected: "3 months" },
]

const financialGoals = [
  {
    name: "Emergency Fund",
    target: 15000,
    current: 12500,
    deadline: "Jun 2024",
    icon: PiggyBank,
    color: "bg-chart-1",
  },
  {
    name: "Vacation Fund",
    target: 5000,
    current: 3200,
    deadline: "Aug 2024",
    icon: Target,
    color: "bg-chart-2",
  },
  {
    name: "New Car Down Payment",
    target: 10000,
    current: 4500,
    deadline: "Dec 2024",
    icon: CreditCard,
    color: "bg-chart-3",
  },
]

const aiInsights = [
  {
    id: "1",
    type: "anomaly",
    priority: "high",
    icon: AlertTriangle,
    title: "Unusual Spending Detected",
    description:
      "Your dining expenses are 40% higher than your 3-month average. You've spent $1,200 this month compared to your usual $850.",
    action: "Review Transactions",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "2",
    type: "positive",
    priority: "medium",
    icon: TrendingUp,
    title: "Savings Rate Improved",
    description:
      "Great job! Your savings rate increased from 18% to 28% over the past 6 months. At this rate, you'll reach your emergency fund goal 2 months early.",
    action: "View Progress",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "3",
    type: "opportunity",
    priority: "medium",
    icon: Lightbulb,
    title: "Potential Savings Opportunity",
    description:
      "You have 5 active subscriptions totaling $175.96/month. Consider reviewing if all are still needed.",
    action: "Review Subscriptions",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "4",
    type: "forecast",
    priority: "low",
    icon: Target,
    title: "Budget Forecast",
    description:
      "Based on your current spending pattern, you're projected to be $250 under budget this month. Consider allocating extra to savings.",
    action: "Adjust Budget",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
]

const weeklySpending = [
  { day: "Mon", amount: 45 },
  { day: "Tue", amount: 78 },
  { day: "Wed", amount: 32 },
  { day: "Thu", amount: 120 },
  { day: "Fri", amount: 95 },
  { day: "Sat", amount: 180 },
  { day: "Sun", amount: 65 },
]

const chartConfig = {
  rate: {
    label: "Savings Rate",
    color: "var(--chart-1)",
  },
  amount: {
    label: "Spending",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Insights</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered analysis and recommendations for your finances
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Insights
        </Button>
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
                <p className="text-2xl font-bold text-foreground">28%</p>
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
                <p className="text-2xl font-bold text-foreground">2/3</p>
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
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold text-foreground">2</p>
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
                <p className="text-sm text-muted-foreground">Financial Score</p>
                <p className="text-2xl font-bold text-foreground">78</p>
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
              <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
            </div>
            <CardDescription>Personalized recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex gap-4 rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}
                >
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
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
                  <Button variant="link" className="mt-2 h-auto p-0 text-primary">
                    {insight.action}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Savings Rate Trend</CardTitle>
              <CardDescription>Your monthly savings percentage</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Weekly Spending Pattern</CardTitle>
              <CardDescription>Your spending by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[180px] w-full">
                <BarChart data={weeklySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
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
            {spendingTrends.map((trend) => (
              <div key={trend.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{trend.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">
                      ${trend.current.toLocaleString()}
                    </span>
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
                      {Math.abs(trend.change)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      trend.change > 0 ? "bg-destructive" : "bg-success"
                    }`}
                    style={{ width: `${Math.min((trend.current / 1500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Financial Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialGoals.map((goal) => {
              const percentage = (goal.current / goal.target) * 100

              return (
                <div key={goal.name} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${goal.color}/10`}>
                      <goal.icon className={`h-4 w-4 ${goal.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{goal.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {goal.deadline}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${goal.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recurring Payments</CardTitle>
            <CardDescription>Detected subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recurringPayments.map((payment) => (
              <div
                key={payment.name}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.frequency} • Detected {payment.detected}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Monthly</span>
                <span className="text-lg font-bold text-foreground">
                  ${recurringPayments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
