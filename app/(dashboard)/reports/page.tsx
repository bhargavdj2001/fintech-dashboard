"use client"

import { useState } from "react"
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  PieChart,
  BarChart3,
  LineChart,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const monthlyOverview = [
  { month: "Jan", income: 8500, expenses: 6200, savings: 2300 },
  { month: "Feb", income: 9200, expenses: 5800, savings: 3400 },
  { month: "Mar", income: 8800, expenses: 7100, savings: 1700 },
  { month: "Apr", income: 9500, expenses: 6400, savings: 3100 },
  { month: "May", income: 10200, expenses: 7200, savings: 3000 },
  { month: "Jun", income: 9800, expenses: 6800, savings: 3000 },
  { month: "Jul", income: 11000, expenses: 7500, savings: 3500 },
  { month: "Aug", income: 10500, expenses: 6900, savings: 3600 },
  { month: "Sep", income: 9900, expenses: 7100, savings: 2800 },
  { month: "Oct", income: 10800, expenses: 7400, savings: 3400 },
  { month: "Nov", income: 11200, expenses: 7800, savings: 3400 },
  { month: "Dec", income: 12500, expenses: 9200, savings: 3300 },
]

const netWorthHistory = [
  { month: "Jan", netWorth: 185000 },
  { month: "Feb", netWorth: 192000 },
  { month: "Mar", netWorth: 198000 },
  { month: "Apr", netWorth: 205000 },
  { month: "May", netWorth: 212000 },
  { month: "Jun", netWorth: 218000 },
  { month: "Jul", netWorth: 225000 },
  { month: "Aug", netWorth: 232000 },
  { month: "Sep", netWorth: 238000 },
  { month: "Oct", netWorth: 242000 },
  { month: "Nov", netWorth: 246000 },
  { month: "Dec", netWorth: 248750 },
]

const categoryBreakdown = [
  { name: "Housing", amount: 2200, percentage: 32.4, color: "var(--chart-1)" },
  { name: "Food & Dining", amount: 1200, percentage: 17.6, color: "var(--chart-2)" },
  { name: "Transportation", amount: 650, percentage: 9.6, color: "var(--chart-3)" },
  { name: "Entertainment", amount: 450, percentage: 6.6, color: "var(--chart-4)" },
  { name: "Utilities", amount: 380, percentage: 5.6, color: "var(--chart-5)" },
  { name: "Shopping", amount: 720, percentage: 10.6, color: "var(--muted)" },
  { name: "Healthcare", amount: 200, percentage: 2.9, color: "var(--chart-1)" },
  { name: "Other", amount: 1000, percentage: 14.7, color: "var(--chart-2)" },
]

const incomeBreakdown = [
  { name: "Salary", amount: 9500, percentage: 76, color: "var(--chart-1)" },
  { name: "Freelance", amount: 1800, percentage: 14.4, color: "var(--chart-2)" },
  { name: "Investments", amount: 850, percentage: 6.8, color: "var(--chart-3)" },
  { name: "Other", amount: 350, percentage: 2.8, color: "var(--chart-4)" },
]

const topMerchants = [
  { name: "Amazon", amount: 892, transactions: 24, trend: 12.5 },
  { name: "Whole Foods", amount: 654, transactions: 18, trend: -5.2 },
  { name: "Shell Gas", amount: 423, transactions: 12, trend: 8.1 },
  { name: "Netflix", amount: 191, transactions: 12, trend: 0 },
  { name: "Starbucks", amount: 178, transactions: 32, trend: 15.3 },
]

const accountSummary = [
  { name: "Checking", balance: 12450, change: 2.5 },
  { name: "Savings", balance: 45200, change: 1.8 },
  { name: "Credit Card", balance: -2340, change: -15.2 },
  { name: "Investment", balance: 156750, change: 8.5 },
]

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-2)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-4)",
  },
  savings: {
    label: "Savings",
    color: "var(--chart-1)",
  },
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function ReportsPage() {
  const [period, setPeriod] = useState("12m")

  const totalIncome = monthlyOverview.reduce((acc, m) => acc + m.income, 0)
  const totalExpenses = monthlyOverview.reduce((acc, m) => acc + m.expenses, 0)
  const totalSavings = totalIncome - totalExpenses
  const avgSavingsRate = (totalSavings / totalIncome) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive financial reports and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowDownLeft className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Savings</p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalSavings.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Savings Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {avgSavingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <LineChart className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="income">
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <PieChart className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="networth">
            <TrendingUp className="mr-2 h-4 w-4" />
            Net Worth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
              <CardDescription>Monthly comparison over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Monthly Savings</CardTitle>
                <CardDescription>Amount saved each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <AreaChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-savings)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-savings)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="var(--color-savings)"
                      strokeWidth={2}
                      fill="url(#fillSavings)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Account Summary</CardTitle>
                <CardDescription>Current balances by account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountSummary.map((account) => (
                  <div
                    key={account.name}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                        {account.name === "Credit Card" ? (
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Wallet className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">{account.name}</span>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold tabular-nums ${
                          account.balance < 0 ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {account.balance < 0 ? "-" : ""}${Math.abs(account.balance).toLocaleString()}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 text-xs ${
                          account.change >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {account.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {account.change >= 0 ? "+" : ""}
                        {account.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Income Trend</CardTitle>
                <CardDescription>Monthly income over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <RechartsLineChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="var(--color-income)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--color-income)", strokeWidth: 0, r: 4 }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Income Sources</CardTitle>
                <CardDescription>Breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={incomeBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="amount"
                          strokeWidth={0}
                        >
                          {incomeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-lg font-bold text-foreground">
                        ${(totalIncome / 12 / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {incomeBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums text-foreground">
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Expense Categories</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={categoryBreakdown}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="amount" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top Merchants</CardTitle>
                <CardDescription>Highest spending merchants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topMerchants.map((merchant, index) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{merchant.name}</p>
                        <p className="text-xs text-muted-foreground">{merchant.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        ${merchant.amount}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 text-xs ${
                          merchant.trend > 0 ? "text-destructive" : merchant.trend < 0 ? "text-success" : "text-muted-foreground"
                        }`}
                      >
                        {merchant.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : merchant.trend < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        {merchant.trend !== 0 && `${Math.abs(merchant.trend)}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
              <CardDescription>Detailed category breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.percentage}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      ${category.amount.toLocaleString()}
                    </p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networth" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Net Worth History</CardTitle>
                  <CardDescription>Track your wealth over time</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Net Worth</p>
                  <p className="text-2xl font-bold text-foreground">$248,750</p>
                  <div className="flex items-center justify-end gap-1 text-sm text-success">
                    <TrendingUp className="h-4 w-4" />
                    +34.5% YoY
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={netWorthHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="var(--color-netWorth)"
                    strokeWidth={2.5}
                    fill="url(#fillNetWorth)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assets</p>
                    <p className="text-xl font-bold text-foreground">$312,500</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Liabilities</p>
                    <p className="text-xl font-bold text-destructive">$63,750</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Change</p>
                    <p className="text-xl font-bold text-success">+$5,750</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
