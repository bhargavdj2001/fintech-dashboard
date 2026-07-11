"use client"

import { useCallback, useEffect, useState } from "react"
import { useCurrency } from "@/lib/currency"
import {
  fetchRecurringRules,
  fetchAccounts,
  fetchCategories,
  fetchHouseholdId,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  type RecurringRule,
  type Account,
  type Category,
} from "@/lib/api"
import {
  Plus,
  Repeat,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type RecurringItem = {
  id: string
  name: string
  amount: number
  frequency: string
  nextDate: string
  category: string
  account: string
  status: string
  type: string
}

type RecurringGroups = {
  income: RecurringItem[]
  bills: RecurringItem[]
  subscriptions: RecurringItem[]
  transfers: RecurringItem[]
}

const EMPTY_GROUPS: RecurringGroups = { income: [], bills: [], subscriptions: [], transfers: [] }

function mapRule(rule: RecurringRule): RecurringItem {
  const t = rule.template_txn as Record<string, unknown> | null
  const type = (t?.type as string) ?? "expense"
  return {
    id: rule.id,
    name: (t?.title as string) ?? "Recurring Rule",
    amount: (t?.amount as number) ?? 0,
    frequency: rule.freq ?? "monthly",
    nextDate: rule.next_run_at
      ? new Date(rule.next_run_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—",
    category: (t?.category as string) ?? "—",
    account: (t?.account as string) ?? "—",
    status: rule.is_active ? "active" : "paused",
    type,
  }
}

function groupRules(rules: RecurringRule[]): RecurringGroups {
  const groups: RecurringGroups = { income: [], bills: [], subscriptions: [], transfers: [] }
  for (const rule of rules) {
    const item = mapRule(rule)
    if (item.type === "income") groups.income.push(item)
    else if (item.type === "transfer") groups.transfers.push(item)
    else groups.bills.push(item)
  }
  return groups
}

const chartConfig = {
  income: { label: "Income", color: "var(--chart-2)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
} satisfies ChartConfig

const FREQ_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

function EditFrequencyDialog({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: RecurringItem
  open: boolean
  onClose: () => void
  onSaved: (id: string, freq: string) => void
}) {
  const [freq, setFreq] = useState(item.frequency)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setFreq(item.frequency) }, [open, item.frequency])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateRecurringRule(item.id, { freq })
      onSaved(item.id, freq)
      onClose()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Frequency</DialogTitle>
          <DialogDescription>{item.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Frequency</Label>
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQ_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecurringCard({
  item,
  onToggle,
  onDelete,
  onEditFreq,
}: {
  item: RecurringItem
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onEditFreq: (item: RecurringItem) => void
}) {
  const { format } = useCurrency()
  const isIncome = item.type === "income"
  const isActive = item.status === "active"

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isIncome ? "bg-success/10" : item.type === "transfer" ? "bg-primary/10" : "bg-destructive/10"
        }`}>
          {isIncome ? (
            <ArrowDownLeft className="h-5 w-5 text-success" />
          ) : (
            <ArrowUpRight className={`h-5 w-5 ${item.type === "transfer" ? "text-primary" : "text-destructive"}`} />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {item.frequency} · Next: {item.nextDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-semibold tabular-nums ${isIncome ? "text-success" : "text-foreground"}`}>
            {format(isIncome ? item.amount : -item.amount, { signDisplay: "exceptZero" })}
          </p>
          <Badge
            variant="secondary"
            className={isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
          >
            {isActive ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
            {item.status}
          </Badge>
        </div>

        <Switch
          checked={isActive}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggle(item.id, !isActive)}>
              {isActive ? "Pause" : "Resume"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditFreq(item)}>
              Edit Frequency
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function AddRecurringDialog({
  open,
  onClose,
  onCreated,
  accounts,
  categories,
}: {
  open: boolean
  onClose: () => void
  onCreated: (rule: RecurringRule) => void
  accounts: Account[]
  categories: Category[]
}) {
  const [type, setType] = useState("expense")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [freq, setFreq] = useState("monthly")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [nextRunAt, setNextRunAt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id)
  }, [accounts])

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createRecurringRule({
        household_id: householdId,
        freq,
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        account_id: accountId || undefined,
        category_id: categoryId !== "none" ? categoryId : undefined,
        next_run_at: nextRunAt ? new Date(nextRunAt).toISOString() : undefined,
        is_active: true,
      })
      onCreated(created)
      setTitle("")
      setAmount("")
      setFreq("monthly")
      setCategoryId("none")
      setNextRunAt("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create rule")
    } finally {
      setSaving(false)
    }
  }

  const filteredCategories = categories.filter((c) => type === "income" ? c.is_income : !c.is_income)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Recurring Transaction</DialogTitle>
          <DialogDescription>Set up a new recurring transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense / Bill</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g. Netflix, Rent, Salary" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Run Date</Label>
              <Input type="date" value={nextRunAt} onChange={(e) => setNextRunAt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Add Recurring"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function RecurringPage() {
  const { format, formatCompact } = useCurrency()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItem | null>(null)
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [groups, setGroups] = useState<RecurringGroups>(EMPTY_GROUPS)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([fetchRecurringRules(), fetchAccounts(), fetchCategories()])
      .then(([r, a, c]) => {
        setRules(r)
        setGroups(groupRules(r))
        setAccounts(a)
        setCategories(c)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const updated = await updateRecurringRule(id, { is_active: active })
      setRules((prev) => prev.map((r) => r.id === id ? updated : r))
      setGroups(groupRules(rules.map((r) => r.id === id ? updated : r)))
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring rule?")) return
    try {
      await deleteRecurringRule(id)
      const updated = rules.filter((r) => r.id !== id)
      setRules(updated)
      setGroups(groupRules(updated))
    } catch (err) { console.error(err) }
  }

  const handleCreated = (rule: RecurringRule) => {
    const updated = [rule, ...rules]
    setRules(updated)
    setGroups(groupRules(updated))
  }

  const handleFreqSaved = (id: string, freq: string) => {
    const updated = rules.map((r) => r.id === id ? { ...r, freq } : r)
    setRules(updated)
    setGroups(groupRules(updated))
  }

  const totalMonthlyIncome = groups.income.reduce((acc, t) => acc + t.amount, 0)
  const totalMonthlyBills = groups.bills.reduce((acc, t) => acc + t.amount, 0)
  const totalSubscriptions = groups.subscriptions.filter((t) => t.status === "active").reduce((acc, t) => acc + t.amount, 0)
  const totalTransfers = groups.transfers.reduce((acc, t) => acc + t.amount, 0)
  const allItems = [...groups.income, ...groups.bills, ...groups.subscriptions, ...groups.transfers]
  const activeCount = allItems.filter((t) => t.status === "active").length

  const forecastData = [
    { month: "This month", income: totalMonthlyIncome, expenses: totalMonthlyBills + totalSubscriptions },
    { month: "Next month", income: totalMonthlyIncome, expenses: totalMonthlyBills + totalSubscriptions },
    { month: "+2 months", income: totalMonthlyIncome, expenses: totalMonthlyBills + totalSubscriptions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recurring income, bills, and subscriptions
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-success">{format(totalMonthlyIncome, { signDisplay: "always" })}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Bills</p>
                <p className="text-2xl font-bold text-destructive">{format(-totalMonthlyBills, { signDisplay: "always" })}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscriptions</p>
                <p className="text-2xl font-bold text-foreground">{format(totalSubscriptions)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recurring Cashflow Forecast</CardTitle>
            <CardDescription>Expected recurring income vs expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
            <CardDescription>Net recurring cashflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recurring Income</span>
              <span className="font-medium text-success">{format(totalMonthlyIncome, { signDisplay: "always" })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bills & Subscriptions</span>
              <span className="font-medium text-destructive">{format(-(totalMonthlyBills + totalSubscriptions), { signDisplay: "always" })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transfers</span>
              <span className="font-medium text-foreground">{format(-totalTransfers, { signDisplay: "always" })}</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Net Monthly</span>
              <span className={`font-bold text-lg ${
                totalMonthlyIncome - totalMonthlyBills - totalSubscriptions - totalTransfers >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}>
                {format(totalMonthlyIncome - totalMonthlyBills - totalSubscriptions - totalTransfers)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Recurring Rules</CardTitle>
          <CardDescription>{allItems.length} rules · {activeCount} active</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading recurring rules...</p>
          ) : allItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recurring rules yet. Click "Add Recurring" to create one.
            </p>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({allItems.length})</TabsTrigger>
                <TabsTrigger value="income">Income ({groups.income.length})</TabsTrigger>
                <TabsTrigger value="bills">Bills ({groups.bills.length})</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions ({groups.subscriptions.length})</TabsTrigger>
                <TabsTrigger value="transfers">Transfers ({groups.transfers.length})</TabsTrigger>
              </TabsList>

              {(["all", "income", "bills", "subscriptions", "transfers"] as const).map((tab) => {
                const items =
                  tab === "all" ? allItems : groups[tab as keyof RecurringGroups]
                return (
                  <TabsContent key={tab} value={tab} className="space-y-3">
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">No {tab} rules.</p>
                    ) : (
                      items.map((item) => (
                        <RecurringCard
                          key={item.id}
                          item={item}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onEditFreq={setEditItem}
                        />
                      ))
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {editItem && (
        <EditFrequencyDialog
          item={editItem}
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSaved={handleFreqSaved}
        />
      )}

      <AddRecurringDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={handleCreated}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
