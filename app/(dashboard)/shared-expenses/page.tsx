"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchTransactions, fetchSplitSummary, type Transaction as ApiTransaction, type SplitSummary } from "@/lib/api"
import {
  Plus,
  Users,
  ArrowRight,
  Check,
  Clock,
  MoreHorizontal,
  UserPlus,
  Receipt,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DateRangePicker, DATE_RANGE_PRESETS } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { parseISO, isWithinInterval } from "date-fns"

const groups = [
  {
    id: "1",
    name: "Household",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Sarah", avatar: "S", color: "bg-chart-2" },
    ],
    balance: 245.5,
    type: "household",
  },
  {
    id: "2",
    name: "Trip to Paris",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Mike", avatar: "M", color: "bg-chart-3" },
      { name: "Lisa", avatar: "L", color: "bg-chart-4" },
    ],
    balance: -180.25,
    type: "trip",
  },
  {
    id: "3",
    name: "Office Lunch",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Alex", avatar: "A", color: "bg-chart-5" },
      { name: "Emma", avatar: "E", color: "bg-chart-1" },
      { name: "Tom", avatar: "T", color: "bg-chart-2" },
    ],
    balance: 52.0,
    type: "project",
  },
]

const expenses = [
  {
    id: "1",
    title: "Groceries",
    amount: 127.45,
    paidBy: "John",
    paidByAvatar: "JD",
    group: "Household",
    date: "Mar 5, 2024",
    splitWith: ["Sarah"],
    status: "pending",
  },
  {
    id: "2",
    title: "Restaurant Dinner",
    amount: 245.0,
    paidBy: "Mike",
    paidByAvatar: "M",
    group: "Trip to Paris",
    date: "Mar 4, 2024",
    splitWith: ["John", "Lisa"],
    status: "settled",
  },
  {
    id: "3",
    title: "Electricity Bill",
    amount: 89.0,
    paidBy: "Sarah",
    paidByAvatar: "S",
    group: "Household",
    date: "Mar 3, 2024",
    splitWith: ["John"],
    status: "pending",
  },
  {
    id: "4",
    title: "Lunch Order",
    amount: 78.5,
    paidBy: "John",
    paidByAvatar: "JD",
    group: "Office Lunch",
    date: "Mar 2, 2024",
    splitWith: ["Alex", "Emma", "Tom"],
    status: "settled",
  },
  {
    id: "5",
    title: "Museum Tickets",
    amount: 120.0,
    paidBy: "Lisa",
    paidByAvatar: "L",
    group: "Trip to Paris",
    date: "Mar 1, 2024",
    splitWith: ["John", "Mike"],
    status: "pending",
  },
]

const balances = [
  { id: "1", person: "Sarah", avatar: "S", owes: false, amount: 108.23, color: "bg-chart-2" },
  { id: "2", person: "Mike", avatar: "M", owes: true, amount: 81.67, color: "bg-chart-3" },
  { id: "3", person: "Lisa", avatar: "L", owes: true, amount: 40.0, color: "bg-chart-4" },
  { id: "4", person: "Alex", avatar: "A", owes: false, amount: 19.63, color: "bg-chart-5" },
]

// Split expense analytics data — enriched with ISO dates and per-person share info
interface SplitTxn {
  id: string
  date: string         // ISO
  title: string
  group: string
  totalAmount: number
  yourShare: number
  partnerShare: number
  paidBy: "you" | "partner"
  status: "settled" | "pending"
}

const monthlyTrendData = [
  { month: "Oct", total: 420, yourShare: 210, partnerShare: 210 },
  { month: "Nov", total: 680, yourShare: 340, partnerShare: 340 },
  { month: "Dec", total: 950, yourShare: 475, partnerShare: 475 },
  { month: "Jan", total: 1115, yourShare: 510, partnerShare: 605 },
  { month: "Feb", total: 1168, yourShare: 584, partnerShare: 584 },
  { month: "Mar", total: 659, yourShare: 249, partnerShare: 249 },
]

const prevMonthSummary = { total: 1168.2, yourShare: 584.1, partnerShare: 584.1, youPaid: 750.8, partnerPaid: 417.4 }

const shareChartConfig = {
  yourShare: { label: "Your Share", color: "var(--chart-1)" },
  partnerShare: { label: "Partner Share", color: "var(--chart-2)" },
} satisfies ChartConfig

const trendChartConfig = {
  yourShare: { label: "Your Share", color: "var(--chart-1)" },
  partnerShare: { label: "Partner Share", color: "var(--chart-2)" },
  total: { label: "Total", color: "var(--chart-3)" },
} satisfies ChartConfig

const paymentChartConfig = {
  youPaid: { label: "You Paid", color: "var(--chart-1)" },
  partnerPaid: { label: "Partner Paid", color: "var(--chart-2)" },
} satisfies ChartConfig

function pct(current: number, previous: number): { value: string; up: boolean } {
  if (previous === 0) return { value: "N/A", up: true }
  const diff = ((current - previous) / Math.abs(previous)) * 100
  return { value: `${Math.abs(diff).toFixed(1)}%`, up: diff >= 0 }
}

function apiToSplitTxn(t: ApiTransaction): SplitTxn | null {
  if (t.splits.length === 0) return null
  const bhargavSplit = t.splits.find((s) => s.profile?.name === "Bhargav")
  const partnerSplit = t.splits.find((s) => s.profile?.name !== "Bhargav")
  if (!bhargavSplit) return null
  const paidBy: "you" | "partner" =
    bhargavSplit.paid_amount > 0 ? "you" : "partner"
  return {
    id: t.id,
    date: t.occurred_at.slice(0, 10),
    title: t.title,
    group: t.category?.name ?? "Household",
    totalAmount: t.amount,
    yourShare: bhargavSplit.share_amount,
    partnerShare: partnerSplit?.share_amount ?? 0,
    paidBy,
    status: t.status === "cleared" ? "settled" : "pending",
  }
}

function AnalyticsTab() {
  const defaultRange = DATE_RANGE_PRESETS[2].getRange() // Last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const [sortField, setSortField] = useState<"date" | "amount">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [allSplitTxns, setAllSplitTxns] = useState<SplitTxn[]>([])

  useEffect(() => {
    fetchTransactions({ limit: 500, offset: 0 })
      .then((res) => {
        const splitTxns = res.items
          .map(apiToSplitTxn)
          .filter((t): t is SplitTxn => t !== null)
        setAllSplitTxns(splitTxns)
      })
      .catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return allSplitTxns
    return allSplitTxns.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: dateRange.from!, end: dateRange.to! })
    )
  }, [dateRange, allSplitTxns])

  const summary = useMemo(() => {
    const total = filtered.reduce((s, t) => s + t.totalAmount, 0)
    const yourShare = filtered.reduce((s, t) => s + t.yourShare, 0)
    const partnerShare = filtered.reduce((s, t) => s + t.partnerShare, 0)
    const youPaid = filtered.filter((t) => t.paidBy === "you").reduce((s, t) => s + t.totalAmount, 0)
    const partnerPaid = filtered.filter((t) => t.paidBy === "partner").reduce((s, t) => s + t.totalAmount, 0)
    const outstanding = filtered.filter((t) => t.status === "pending").reduce((s, t) => s + t.yourShare, 0)
    return { total, yourShare, partnerShare, youPaid, partnerPaid, outstanding }
  }, [filtered])

  const shareDistribution = [
    { name: "Your Share", value: summary.yourShare, fill: "var(--chart-1)" },
    { name: "Partner Share", value: summary.partnerShare, fill: "var(--chart-2)" },
  ]

  const paymentDistribution = [
    { name: "You", youPaid: summary.youPaid, partnerPaid: 0 },
    { name: "Partner", youPaid: 0, partnerPaid: summary.partnerPaid },
  ]

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === "date") cmp = a.date.localeCompare(b.date)
      else cmp = a.totalAmount - b.totalAmount
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const toggleSort = (field: "date" | "amount") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("desc") }
  }

  const totalPct = pct(summary.total, prevMonthSummary.total)
  const yourPct = pct(summary.yourShare, prevMonthSummary.yourShare)
  const youPaidPct = pct(summary.youPaid, prevMonthSummary.youPaid)

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Split Expense Ownership Analytics
        </h2>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Shared", value: `$${summary.total.toFixed(2)}`, sub: `${filtered.length} transactions` },
          { label: "Your Share", value: `$${summary.yourShare.toFixed(2)}`, sub: `${summary.total > 0 ? ((summary.yourShare / summary.total) * 100).toFixed(1) : 0}% of total` },
          { label: "Partner Share", value: `$${summary.partnerShare.toFixed(2)}`, sub: `${summary.total > 0 ? ((summary.partnerShare / summary.total) * 100).toFixed(1) : 0}% of total` },
          { label: "You Paid", value: `$${summary.youPaid.toFixed(2)}`, sub: "upfront total" },
          { label: "Partner Paid", value: `$${summary.partnerPaid.toFixed(2)}`, sub: "upfront total" },
          { label: "Outstanding", value: `$${summary.outstanding.toFixed(2)}`, sub: "your pending", valueClass: summary.outstanding > 0 ? "text-warning" : "text-success" },
        ].map(({ label, value, sub, valueClass }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${valueClass ?? "text-foreground"}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Share Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Share Distribution</CardTitle>
            <CardDescription>Your share vs partner share</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={shareDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {shareDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1">
              {shareDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Responsibility Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payment Responsibility</CardTitle>
            <CardDescription>Who paid upfront</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentChartConfig} className="h-[200px] w-full">
              <BarChart
                data={[
                  { name: "You", youPaid: summary.youPaid },
                  { name: "Partner", partnerPaid: summary.partnerPaid },
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="youPaid" name="You Paid" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="partnerPaid" name="Partner Paid" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
            <CardDescription>Shared expenses over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[200px] w-full">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                <Line type="monotone" dataKey="yourShare" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="partnerShare" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" stroke="var(--chart-3)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          vs. Previous Period
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Shared", curr: summary.total, p: totalPct },
            { label: "Your Share", curr: summary.yourShare, p: yourPct },
            { label: "You Paid Upfront", curr: summary.youPaid, p: youPaidPct },
          ].map(({ label, curr, p }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">${curr.toFixed(2)}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${p.up ? "text-destructive" : "text-success"}`}>
                  {p.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {p.up ? "+" : "-"}{p.value} vs last period
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Split Transaction Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Split Transactions</CardTitle>
              <CardDescription>{sorted.length} expenses in selected period</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground" onClick={() => toggleSort("date")}>
                    Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Expense</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground" onClick={() => toggleSort("amount")}>
                    Total <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Your Share</TableHead>
                <TableHead className="text-right">Partner Share</TableHead>
                <TableHead>Who Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No split expenses in this period
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground text-sm">{txn.date}</TableCell>
                    <TableCell className="font-medium text-foreground">{txn.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{txn.group}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">${txn.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums text-chart-1">${txn.yourShare.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums text-chart-2">${txn.partnerShare.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={txn.paidBy === "you" ? "bg-chart-1/10 text-chart-1" : "bg-chart-2/10 text-chart-2"}
                      >
                        {txn.paidBy === "you" ? "You" : "Partner"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={txn.status === "settled" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                      >
                        {txn.status === "settled" ? (
                          <><Check className="mr-1 h-3 w-3" />Settled</>
                        ) : (
                          <><Clock className="mr-1 h-3 w-3" />Pending</>
                        )}
                      </Badge>
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

export default function SharedExpensesPage() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [splitSummary, setSplitSummary] = useState<SplitSummary | null>(null)

  useEffect(() => {
    fetchSplitSummary().then(setSplitSummary).catch(console.error)
  }, [])

  // net_balance > 0 means partner owes you (you are owed)
  // net_balance < 0 means you owe partner
  const netBalance = splitSummary?.net_balance ?? 0
  const totalOwed = netBalance > 0 ? netBalance : 0
  const totalOwing = netBalance < 0 ? Math.abs(netBalance) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Split bills and track shared costs with friends and family
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>Add a group to share expenses with</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input id="groupName" placeholder="e.g., Roommates, Trip" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupType">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="trip">Trip</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddGroupOpen(false)}>Create Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shared Expense</DialogTitle>
                <DialogDescription>Add an expense to split with others</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseTitle">Description</Label>
                  <Input id="expenseTitle" placeholder="What was the expense for?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount</Label>
                  <Input id="expenseAmount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseGroup">Group</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Split Method</Label>
                  <Select defaultValue="equal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Split Equally</SelectItem>
                      <SelectItem value="percentage">By Percentage</SelectItem>
                      <SelectItem value="custom">Custom Amounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddExpenseOpen(false)}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Are Owed</p>
                <p className="text-2xl font-bold text-success">+${totalOwed.toFixed(2)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Owe</p>
                <p className="text-2xl font-bold text-destructive">-${totalOwing.toFixed(2)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalOwed - totalOwing).toFixed(2)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Groups</h2>
          {groups.map((group) => (
            <Card key={group.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{group.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 3).map((member, i) => (
                            <Avatar key={i} className="h-5 w-5 border-2 border-background">
                              <AvatarFallback className={`${member.color} text-[10px] text-white`}>
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          {group.members.length} members
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        group.balance >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {group.balance >= 0 ? "+" : ""}${Math.abs(group.balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="expenses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="analytics">
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Shared Expenses</CardTitle>
                  <CardDescription>All your shared expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {expense.paidByAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{expense.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Paid by {expense.paidBy}</span>
                            <span>•</span>
                            <span>{expense.group}</span>
                            <span>•</span>
                            <span>{expense.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            ${expense.amount.toFixed(2)}
                          </p>
                          <Badge
                            variant="secondary"
                            className={
                              expense.status === "settled"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }
                          >
                            {expense.status === "settled" ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {expense.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Settled</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balances" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
                  <CardDescription>Outstanding balances with others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {balances.map((balance) => (
                    <div
                      key={balance.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${balance.color} text-white`}>
                            {balance.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{balance.person}</p>
                          <p className="text-xs text-muted-foreground">
                            {balance.owes ? "owes you" : "you owe"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-semibold tabular-nums ${
                            balance.owes ? "text-destructive" : "text-success"
                          }`}
                        >
                          {balance.owes ? "-" : "+"}${balance.amount.toFixed(2)}
                        </span>
                        <Button variant="outline" size="sm">
                          {balance.owes ? "Request" : "Settle"}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
