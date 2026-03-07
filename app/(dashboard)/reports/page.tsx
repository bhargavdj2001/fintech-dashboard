"use client"

import { useState, useMemo } from "react"
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  PieChart,
  BarChart3,
  LineChart,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Search,
  ArrowUpDown,
  CalendarDays,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  startOfMonth,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { DateRangePicker, type DateRange } from "@/components/date-range-picker"

// ─── Static data ─────────────────────────────────────────────────────────────

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

// ─── Period Analysis mock data ────────────────────────────────────────────────

type TxnType = "income" | "expense" | "transfer"
type TxnStatus = "posted" | "pending"

interface PeriodTxn {
  id: string
  date: string
  title: string
  merchant: string
  account: string
  category: string
  tags: string[]
  amount: number
  type: TxnType
  status: TxnStatus
  isSplit: boolean
}

const ALL_TRANSACTIONS: PeriodTxn[] = [
  { id: "T001", date: "2024-03-01", title: "Salary Deposit", merchant: "Acme Corp", account: "Checking", category: "Income", tags: ["salary"], amount: 5200, type: "income", status: "posted", isSplit: false },
  { id: "T002", date: "2024-03-03", title: "Grocery Shopping", merchant: "Whole Foods", account: "Credit Card", category: "Food & Dining", tags: ["groceries"], amount: -127.45, type: "expense", status: "posted", isSplit: false },
  { id: "T003", date: "2024-03-04", title: "Electric Bill", merchant: "City Power", account: "Checking", category: "Utilities", tags: ["utilities", "recurring"], amount: -89, type: "expense", status: "posted", isSplit: true },
  { id: "T004", date: "2024-03-05", title: "Freelance Payment", merchant: "Client XYZ", account: "Checking", category: "Income", tags: ["freelance"], amount: 850, type: "income", status: "posted", isSplit: false },
  { id: "T005", date: "2024-03-05", title: "Restaurant Dinner", merchant: "The Italian Place", account: "Credit Card", category: "Food & Dining", tags: ["dining"], amount: -64.5, type: "expense", status: "posted", isSplit: true },
  { id: "T006", date: "2024-03-06", title: "Netflix", merchant: "Netflix", account: "Credit Card", category: "Entertainment", tags: ["subscription"], amount: -15.99, type: "expense", status: "posted", isSplit: false },
  { id: "T007", date: "2024-03-06", title: "Gas Station", merchant: "Shell", account: "Debit Card", category: "Transportation", tags: ["fuel"], amount: -45, type: "expense", status: "posted", isSplit: false },
  { id: "T008", date: "2024-03-07", title: "Investment Transfer", merchant: "Vanguard", account: "Checking", category: "Transfer", tags: ["investment"], amount: -500, type: "transfer", status: "pending", isSplit: false },
  { id: "T009", date: "2024-03-07", title: "Coffee", merchant: "Starbucks", account: "Debit Card", category: "Food & Dining", tags: ["coffee"], amount: -5.75, type: "expense", status: "posted", isSplit: false },
  { id: "T010", date: "2024-03-08", title: "Phone Bill", merchant: "Verizon", account: "Credit Card", category: "Utilities", tags: ["utilities"], amount: -65, type: "expense", status: "pending", isSplit: false },
  { id: "T011", date: "2024-03-10", title: "Grocery Shopping", merchant: "Trader Joe's", account: "Credit Card", category: "Food & Dining", tags: ["groceries"], amount: -98.3, type: "expense", status: "posted", isSplit: false },
  { id: "T012", date: "2024-03-12", title: "Gym Membership", merchant: "24 Hour Fitness", account: "Credit Card", category: "Healthcare", tags: ["health", "recurring"], amount: -49, type: "expense", status: "posted", isSplit: false },
  { id: "T013", date: "2024-03-14", title: "Amazon Purchase", merchant: "Amazon", account: "Credit Card", category: "Shopping", tags: ["shopping"], amount: -134.99, type: "expense", status: "posted", isSplit: false },
  { id: "T014", date: "2024-03-15", title: "Rent Payment", merchant: "Oakwood Apartments", account: "Checking", category: "Housing", tags: ["rent", "recurring"], amount: -2200, type: "expense", status: "posted", isSplit: true },
  { id: "T015", date: "2024-03-18", title: "Freelance Invoice", merchant: "Client ABC", account: "Checking", category: "Income", tags: ["freelance"], amount: 1500, type: "income", status: "posted", isSplit: false },
  { id: "T016", date: "2024-02-01", title: "Salary Deposit", merchant: "Acme Corp", account: "Checking", category: "Income", tags: ["salary"], amount: 5200, type: "income", status: "posted", isSplit: false },
  { id: "T017", date: "2024-02-03", title: "Grocery Shopping", merchant: "Whole Foods", account: "Credit Card", category: "Food & Dining", tags: ["groceries"], amount: -112.6, type: "expense", status: "posted", isSplit: false },
  { id: "T018", date: "2024-02-08", title: "Electric Bill", merchant: "City Power", account: "Checking", category: "Utilities", tags: ["utilities"], amount: -78, type: "expense", status: "posted", isSplit: true },
  { id: "T019", date: "2024-02-15", title: "Rent Payment", merchant: "Oakwood Apartments", account: "Checking", category: "Housing", tags: ["rent"], amount: -2200, type: "expense", status: "posted", isSplit: true },
  { id: "T020", date: "2024-02-20", title: "Spotify", merchant: "Spotify", account: "Credit Card", category: "Entertainment", tags: ["subscription"], amount: -9.99, type: "expense", status: "posted", isSplit: false },
]

const accountSpendData = [
  { account: "Checking", amount: 2854, color: "var(--chart-1)" },
  { account: "Credit Card", amount: 1890, color: "var(--chart-2)" },
  { account: "Debit Card", amount: 510, color: "var(--chart-3)" },
]

const comparisonMetrics = {
  current: { label: "Mar 2024", income: 7550, expenses: 3394.99, shared: 2353 },
  previous: { label: "Feb 2024", income: 5200, expenses: 2400.59, shared: 2278 },
}

// ─── Chart configs ────────────────────────────────────────────────────────────

const overviewChartConfig = {
  income: { label: "Income", color: "var(--chart-2)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
  savings: { label: "Savings", color: "var(--chart-1)" },
  netWorth: { label: "Net Worth", color: "var(--chart-1)" },
} satisfies ChartConfig

const periodChartConfig = {
  expenses: { label: "Expenses", color: "var(--chart-4)" },
  income: { label: "Income", color: "var(--chart-2)" },
  amount: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig

// ─── Shared export menu ───────────────────────────────────────────────────────

function ExportMenu() {
  return (
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
          <BarChart3 className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function pct(current: number, previous: number) {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

// ─── Period Analysis tab ──────────────────────────────────────────────────────

function PeriodAnalysisTab() {
  const defaultRange: DateRange = {
    from: startOfMonth(new Date("2024-03-01")),
    to: endOfMonth(new Date("2024-03-01")),
  }

  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortField, setSortField] = useState<"date" | "amount">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const periodTxns = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return ALL_TRANSACTIONS
    return ALL_TRANSACTIONS.filter((t) => {
      const d = parseISO(t.date)
      return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! })
    })
  }, [dateRange])

  const summary = useMemo(() => {
    const income = periodTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expenses = periodTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0)
    const transfers = periodTxns.filter((t) => t.type === "transfer").reduce((s, t) => s + Math.abs(t.amount), 0)
    return { income, expenses, transfers, net: income - expenses, count: periodTxns.length }
  }, [periodTxns])

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    periodTxns.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount)
    })
    const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], i) => ({ name, amount: Math.round(amount * 100) / 100, color: colors[i % colors.length] }))
  }, [periodTxns])

  const incomeSourceData = useMemo(() => {
    const map: Record<string, number> = {}
    periodTxns.filter((t) => t.type === "income").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
    const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"]
    return Object.entries(map).map(([name, amount], i) => ({ name, amount, color: colors[i % colors.length] }))
  }, [periodTxns])

  const tableData = useMemo(() => {
    return periodTxns
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.merchant.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === "all" || t.type === typeFilter
        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        const diff =
          sortField === "date"
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : Math.abs(a.amount) - Math.abs(b.amount)
        return sortDir === "asc" ? diff : -diff
      })
  }, [periodTxns, search, typeFilter, sortField, sortDir])

  const toggleSort = (field: "date" | "amount") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("desc") }
  }

  const rangeLabel =
    dateRange.from && dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : "Selected period"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Financial Period Analysis</h2>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
          <ExportMenu />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Income", value: `+$${summary.income.toLocaleString()}`, cls: "text-success" },
          { label: "Total Expenses", value: `-$${summary.expenses.toLocaleString()}`, cls: "text-destructive" },
          { label: "Transfers", value: `$${summary.transfers.toLocaleString()}`, cls: "text-primary" },
          { label: "Net Cashflow", value: `${summary.net >= 0 ? "+" : ""}$${summary.net.toLocaleString()}`, cls: summary.net >= 0 ? "text-success" : "text-destructive" },
          { label: "Transactions", value: String(summary.count), cls: "text-foreground" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${card.cls}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
            <CardDescription>{rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="relative h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="amount" strokeWidth={0}>
                          {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-base font-bold">${summary.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {categoryData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No expense data for period</p>
            )}
          </CardContent>
        </Card>

        {/* Income sources pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Income Sources</CardTitle>
            <CardDescription>{rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeSourceData.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="relative h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={incomeSourceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="amount" strokeWidth={0}>
                          {incomeSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-base font-bold text-success">${summary.income.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {incomeSourceData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No income data for period</p>
            )}
          </CardContent>
        </Card>

        {/* Account spending bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Spending by Account</CardTitle>
            <CardDescription>Which accounts you spent from</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={periodChartConfig} className="h-[160px] w-full">
              <BarChart data={accountSpendData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="account" tickLine={false} axisLine={false} fontSize={11} width={75} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {accountSpendData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-4 space-y-1.5">
              {accountSpendData.map((item) => (
                <div key={item.account} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.account}</span>
                  </div>
                  <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Comparison</CardTitle>
          <CardDescription>
            {comparisonMetrics.current.label} vs {comparisonMetrics.previous.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Total Spending", icon: ArrowUpRight, cur: comparisonMetrics.current.expenses, prev: comparisonMetrics.previous.expenses, higherIsBad: true },
              { label: "Total Income", icon: ArrowDownLeft, cur: comparisonMetrics.current.income, prev: comparisonMetrics.previous.income, higherIsBad: false },
              { label: "Shared Expenses", icon: ArrowUpRight, cur: comparisonMetrics.current.shared, prev: comparisonMetrics.previous.shared, higherIsBad: true },
            ].map((metric) => {
              const change = pct(metric.cur, metric.prev)
              const isGood = metric.higherIsBad ? change < 0 : change > 0
              const Icon = metric.icon
              return (
                <div key={metric.label} className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">${metric.cur.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">vs ${metric.prev.toLocaleString()} last period</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${isGood ? "text-success" : "text-destructive"}`}>
                    {isGood ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {Math.abs(change).toFixed(1)}%
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {change > 0 ? "increase" : "decrease"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed transaction table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Transaction Detail</CardTitle>
              <CardDescription>{tableData.length} of {periodTxns.length} transactions</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="w-[180px] pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <ExportMenu />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1 text-xs font-medium" onClick={() => toggleSort("date")}>
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Title / Merchant</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Split</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <button className="flex items-center gap-1 text-xs font-medium ml-auto" onClick={() => toggleSort("amount")}>
                    Amount <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No transactions match the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(txn.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground text-sm">{txn.title}</p>
                      <p className="text-xs text-muted-foreground">{txn.merchant}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{txn.account}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">{txn.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {txn.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {txn.isSplit && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Split</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={txn.status === "posted" ? "bg-success/10 text-success text-xs" : "bg-warning/10 text-warning text-xs"}
                      >
                        {txn.status === "posted" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`tabular-nums font-semibold text-sm ${txn.type === "income" ? "text-success" : txn.type === "transfer" ? "text-primary" : "text-foreground"}`}>
                        {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
              <CalendarDays className="mr-2 h-4 w-4" />
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
          <ExportMenu />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">${totalIncome.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-destructive">${totalExpenses.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">${totalSavings.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">{avgSavingsRate.toFixed(1)}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">
            <LineChart className="mr-2 h-4 w-4" />Overview
          </TabsTrigger>
          <TabsTrigger value="income">
            <ArrowDownLeft className="mr-2 h-4 w-4" />Income
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <PieChart className="mr-2 h-4 w-4" />Expenses
          </TabsTrigger>
          <TabsTrigger value="networth">
            <TrendingUp className="mr-2 h-4 w-4" />Net Worth
          </TabsTrigger>
          <TabsTrigger value="period">
            <Activity className="mr-2 h-4 w-4" />Period Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
              <CardDescription>Monthly comparison over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={overviewChartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
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
                <ChartContainer config={overviewChartConfig} className="h-[250px] w-full">
                  <AreaChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-savings)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-savings)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Area type="monotone" dataKey="savings" stroke="var(--color-savings)" strokeWidth={2} fill="url(#fillSavings)" />
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
                  <div key={account.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
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
                      <p className={`font-semibold tabular-nums ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                        {account.balance < 0 ? "-" : ""}${Math.abs(account.balance).toLocaleString()}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-xs ${account.change >= 0 ? "text-success" : "text-destructive"}`}>
                        {account.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {account.change >= 0 ? "+" : ""}{account.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Income tab */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Income Trend</CardTitle>
                <CardDescription>Monthly income over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={overviewChartConfig} className="h-[300px] w-full">
                  <RechartsLineChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2.5} dot={{ fill: "var(--color-income)", strokeWidth: 0, r: 4 }} />
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
                <div className="flex justify-center">
                  <div className="relative h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="amount" strokeWidth={0}>
                          {incomeBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">Avg/mo</span>
                      <span className="text-lg font-bold">${(totalIncome / 12 / 1000).toFixed(1)}k</span>
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
                      <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Expense Categories</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={overviewChartConfig} className="h-[300px] w-full">
                  <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={100} />
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
                  <div key={merchant.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground">{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{merchant.name}</p>
                        <p className="text-xs text-muted-foreground">{merchant.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">${merchant.amount}</p>
                      <div className={`flex items-center justify-end gap-1 text-xs ${merchant.trend > 0 ? "text-destructive" : merchant.trend < 0 ? "text-success" : "text-muted-foreground"}`}>
                        {merchant.trend > 0 ? <TrendingUp className="h-3 w-3" /> : merchant.trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
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
                      <Badge variant="secondary" className="text-xs">{category.percentage}%</Badge>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">${category.amount.toLocaleString()}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${category.percentage}%`, backgroundColor: category.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Net Worth tab */}
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
                    <TrendingUp className="h-4 w-4" />+34.5% YoY
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={overviewChartConfig} className="h-[350px] w-full">
                <AreaChart data={netWorthHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area type="monotone" dataKey="netWorth" stroke="var(--color-netWorth)" strokeWidth={2.5} fill="url(#fillNetWorth)" />
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

        {/* Period Analysis tab */}
        <TabsContent value="period">
          <PeriodAnalysisTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
