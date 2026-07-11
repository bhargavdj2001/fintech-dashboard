"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useCurrency } from "@/lib/currency"
import {
  fetchTransactions,
  fetchSplitSummary,
  fetchBalancesByPartner,
  fetchSettlements,
  fetchProfiles,
  fetchAccounts,
  fetchCategories,
  fetchHouseholdId,
  createTransaction,
  createSettlement,
  type Transaction as ApiTransaction,
  type SplitSummary,
  type PartnerBalance,
  type Settlement,
  type Profile,
  type Account,
  type Category,
} from "@/lib/api"
import {
  Plus,
  Users,
  ArrowRight,
  Check,
  Clock,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  ResponsiveContainer,
} from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DateRangePicker, DATE_RANGE_PRESETS } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { parseISO, isWithinInterval, subMonths, startOfMonth, format as formatDate } from "date-fns"

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
  // "You" = the split whose profile is flagged is_owner; fall back to the
  // first split if no profile in this set is flagged (defensive, mirrors
  // the backend's analytics_service fallback).
  const ownerSplit = t.splits.find((s) => s.profile?.is_owner) ?? t.splits[0]
  const otherSplit = t.splits.find((s) => s.profile?.id !== ownerSplit.profile?.id)
  const paidBy: "you" | "partner" =
    ownerSplit.paid_amount > 0 ? "you" : "partner"
  return {
    id: t.id,
    date: t.occurred_at.slice(0, 10),
    title: t.title,
    group: t.category?.name ?? "Household",
    totalAmount: t.amount,
    yourShare: ownerSplit.share_amount,
    partnerShare: otherSplit?.share_amount ?? 0,
    paidBy,
    status: t.status === "cleared" ? "settled" : "pending",
  }
}

function AnalyticsTab() {
  const { format, formatCompact } = useCurrency()
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

  const monthlyTrendData = useMemo(() => {
    const now = new Date()
    const months: { month: string; year: number; idx: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i))
      months.push({ month: formatDate(d, "MMM"), year: d.getFullYear(), idx: d.getMonth() })
    }
    return months.map(({ month, year, idx }) => {
      const inMonth = allSplitTxns.filter((t) => {
        const d = parseISO(t.date)
        return d.getFullYear() === year && d.getMonth() === idx
      })
      const total = inMonth.reduce((s, t) => s + t.totalAmount, 0)
      const yourShare = inMonth.reduce((s, t) => s + t.yourShare, 0)
      const partnerShare = inMonth.reduce((s, t) => s + t.partnerShare, 0)
      return { month, total: Math.round(total * 100) / 100, yourShare: Math.round(yourShare * 100) / 100, partnerShare: Math.round(partnerShare * 100) / 100 }
    })
  }, [allSplitTxns])

  const prevMonthSummary = useMemo(() => {
    const prevStart = startOfMonth(subMonths(dateRange.from ?? new Date(), 1))
    const prevEnd = startOfMonth(dateRange.from ?? new Date())
    const inPrev = allSplitTxns.filter((t) => {
      const d = parseISO(t.date)
      return d >= prevStart && d < prevEnd
    })
    return {
      total: inPrev.reduce((s, t) => s + t.totalAmount, 0),
      yourShare: inPrev.reduce((s, t) => s + t.yourShare, 0),
      partnerShare: inPrev.reduce((s, t) => s + t.partnerShare, 0),
      youPaid: inPrev.filter((t) => t.paidBy === "you").reduce((s, t) => s + t.totalAmount, 0),
      partnerPaid: inPrev.filter((t) => t.paidBy === "partner").reduce((s, t) => s + t.totalAmount, 0),
    }
  }, [allSplitTxns, dateRange])

  const shareDistribution = [
    { name: "Your Share", value: summary.yourShare, fill: "var(--chart-1)" },
    { name: "Partner Share", value: summary.partnerShare, fill: "var(--chart-2)" },
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
          { label: "Total Shared", value: format(summary.total), sub: `${filtered.length} transactions` },
          { label: "Your Share", value: format(summary.yourShare), sub: `${summary.total > 0 ? ((summary.yourShare / summary.total) * 100).toFixed(1) : 0}% of total` },
          { label: "Partner Share", value: format(summary.partnerShare), sub: `${summary.total > 0 ? ((summary.partnerShare / summary.total) * 100).toFixed(1) : 0}% of total` },
          { label: "You Paid", value: format(summary.youPaid), sub: "upfront total" },
          { label: "Partner Paid", value: format(summary.partnerPaid), sub: "upfront total" },
          { label: "Outstanding", value: format(summary.outstanding), sub: "your pending", valueClass: summary.outstanding > 0 ? "text-warning" : "text-success" },
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
                  formatter={(value: number) => [format(value), ""]}
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
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} />
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
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} />
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
                <p className="text-xl font-bold text-foreground mt-0.5">{format(curr)}</p>
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
                    <TableCell className="text-right font-semibold tabular-nums">{format(txn.totalAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-chart-1">{format(txn.yourShare)}</TableCell>
                    <TableCell className="text-right tabular-nums text-chart-2">{format(txn.partnerShare)}</TableCell>
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

interface SharedExpense {
  id: string
  title: string
  amount: number
  paidByName: string
  category: string
  date: string
  status: "settled" | "pending"
}

function apiToSharedExpense(t: ApiTransaction): SharedExpense | null {
  if (t.splits.length === 0) return null
  const payer = t.splits.find((s) => s.paid_amount > 0)?.profile?.name ?? "—"
  return {
    id: t.id,
    title: t.title,
    amount: t.amount,
    paidByName: payer,
    category: t.category?.name ?? "Shared",
    date: new Date(t.occurred_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: t.status === "cleared" ? "settled" : "pending",
  }
}

function AddExpenseDialog({
  open,
  onClose,
  onCreated,
  profiles,
  accounts,
  categories,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  profiles: Profile[]
  accounts: Account[]
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [paidByProfileId, setPaidByProfileId] = useState("")
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal")
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const expenseCategories = categories.filter((c) => !c.is_income)

  useEffect(() => {
    if (open) {
      setAccountId((prev) => prev || accounts[0]?.id || "")
      setPaidByProfileId((prev) => prev || profiles.find((p) => p.is_owner)?.id || profiles[0]?.id || "")
      setParticipantIds((prev) => (prev.length > 0 ? prev : profiles.map((p) => p.id)))
    }
  }, [open, accounts, profiles])

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const customTotal = participantIds.reduce((sum, id) => sum + (parseFloat(customShares[id]) || 0), 0)

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Description is required"); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError("Enter a valid amount > 0"); return }
    if (!accountId) { setError("Select an account"); return }
    if (participantIds.length < 2) { setError("Select at least two people to split this expense between"); return }

    const shares: Record<string, number> = {}
    if (splitMethod === "equal") {
      const equalShare = amt / participantIds.length
      participantIds.forEach((id) => { shares[id] = equalShare })
    } else {
      if (Math.abs(customTotal - amt) > 0.01) {
        setError(`Custom shares must add up to ${amt.toFixed(2)} (currently ${customTotal.toFixed(2)})`)
        return
      }
      participantIds.forEach((id) => { shares[id] = parseFloat(customShares[id]) || 0 })
    }

    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      await createTransaction({
        household_id: householdId,
        account_id: accountId,
        title: title.trim(),
        amount: amt,
        type: "expense",
        occurred_at: new Date().toISOString(),
        category_id: categoryId !== "none" ? categoryId : undefined,
        created_by_profile_id: paidByProfileId,
        splits: participantIds.map((id) => ({
          profile_id: id,
          share_amount: shares[id],
          paid_amount: id === paidByProfileId ? amt : 0,
        })),
      })
      onCreated()
      setTitle(""); setAmount(""); setCategoryId("none"); setCustomShares({}); setSplitMethod("equal")
      setAccountId(""); setPaidByProfileId(""); setParticipantIds([])
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add expense")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shared Expense</DialogTitle>
          <DialogDescription>Add an expense and split it between two household members</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="What was the expense for?" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paid By</Label>
            <Select value={paidByProfileId} onValueChange={setPaidByProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Split Between</Label>
            <div className="space-y-2 rounded-lg border border-border/50 p-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`participant-${p.id}`}
                    checked={participantIds.includes(p.id)}
                    onCheckedChange={() => toggleParticipant(p.id)}
                  />
                  <Label htmlFor={`participant-${p.id}`} className="font-normal cursor-pointer">{p.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Split Method</Label>
            <Select value={splitMethod} onValueChange={(v) => setSplitMethod(v as "equal" | "custom")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Split Equally</SelectItem>
                <SelectItem value="custom">Custom Amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {splitMethod === "custom" && (
            <div className="space-y-2">
              <Label>Each person&apos;s share (must total {amount || "0.00"})</Label>
              {participantIds.map((id) => {
                const profile = profiles.find((p) => p.id === id)
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="w-24 text-sm text-muted-foreground">{profile?.name}</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customShares[id] ?? ""}
                      onChange={(e) => setCustomShares((prev) => ({ ...prev, [id]: e.target.value }))}
                    />
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground">Total: {customTotal.toFixed(2)}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Expense"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SharedExpensesPage() {
  const { format } = useCurrency()
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [splitSummary, setSplitSummary] = useState<SplitSummary | null>(null)
  const [partnerBalances, setPartnerBalances] = useState<PartnerBalance[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([])

  const loadAll = useCallback(() => {
    Promise.all([
      fetchSplitSummary(),
      fetchBalancesByPartner(),
      fetchSettlements(),
      fetchProfiles(),
      fetchAccounts(),
      fetchCategories(),
      fetchTransactions({ limit: 500, offset: 0 }),
    ])
      .then(([summary, balances, settles, profs, accts, cats, txns]) => {
        setSplitSummary(summary)
        setPartnerBalances(balances)
        setSettlements(settles)
        setProfiles(profs)
        setAccounts(accts)
        setCategories(cats)
        setSharedExpenses(
          txns.items.map(apiToSharedExpense).filter((e): e is SharedExpense => e !== null)
        )
      })
      .catch(console.error)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // net_balance > 0 means partner owes you (you are owed)
  // net_balance < 0 means you owe partner
  const netBalance = splitSummary?.net_balance ?? 0
  const totalOwed = netBalance > 0 ? netBalance : 0
  const totalOwing = netBalance < 0 ? Math.abs(netBalance) : 0

  // "You" = the is_owner-flagged profile; fall back to the first profile if
  // none is flagged (defensive, mirrors the backend's analytics fallback).
  const you = profiles.find((p) => p.is_owner) ?? profiles[0]
  const [settlingWithId, setSettlingWithId] = useState<string | null>(null)

  const handleSettleUpWith = async (partner: PartnerBalance) => {
    if (!you || partner.net_balance === 0) return
    setSettlingWithId(partner.profile_id)
    try {
      const householdId = await fetchHouseholdId()
      // net_balance > 0: this person owes you, so they pay you to settle.
      const [fromId, toId] = partner.net_balance > 0 ? [partner.profile_id, you.id] : [you.id, partner.profile_id]
      await createSettlement({
        household_id: householdId,
        from_profile_id: fromId,
        to_profile_id: toId,
        amount: Math.abs(partner.net_balance),
      })
      loadAll()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to settle up")
    } finally {
      setSettlingWithId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Split bills and track shared costs with your partner
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Are Owed</p>
                <p className="text-2xl font-bold text-success">{format(totalOwed)}</p>
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
                <p className="text-2xl font-bold text-destructive">{format(-totalOwing)}</p>
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
                  {format(totalOwed - totalOwing)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {sharedExpenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No shared expenses yet.</p>
              ) : (
                sharedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {expense.paidByName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{expense.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Paid by {expense.paidByName}</span>
                          <span>•</span>
                          <span>{expense.category}</span>
                          <span>•</span>
                          <span>{expense.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {format(expense.amount)}
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
              <CardDescription>Your balance with each household member individually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {partnerBalances.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">All settled up!</p>
              ) : (
                partnerBalances.map((p) => (
                  <div key={p.profile_id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-chart-2 text-white">
                          {p.profile_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{p.profile_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.net_balance === 0 ? "settled up" : p.net_balance > 0 ? "owes you" : "you owe"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-semibold tabular-nums ${p.net_balance > 0 ? "text-success" : p.net_balance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {format(p.net_balance, { signDisplay: "exceptZero" })}
                      </span>
                      {p.net_balance !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettleUpWith(p)}
                          disabled={settlingWithId === p.profile_id}
                        >
                          {settlingWithId === p.profile_id ? "Settling..." : "Settle Up"}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {settlements.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Settlement History
                  </h3>
                  <div className="space-y-2">
                    {settlements.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                          {s.from_profile?.name ?? "—"} → {s.to_profile?.name ?? "—"}
                        </span>
                        <span className="font-medium text-foreground">{format(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onCreated={loadAll}
        profiles={profiles}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
