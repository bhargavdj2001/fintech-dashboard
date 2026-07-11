"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCurrency } from "@/lib/currency"
import {
  fetchBudgets,
  fetchCategories,
  fetchHouseholdId,
  createBudget,
  createCategory,
  updateBudget,
  deleteBudget,
  fetchTransactions,
  fetchPeriodReport,
  type Budget as ApiBudget,
  type Category,
  type Transaction,
} from "@/lib/api"
import { subMonths, startOfMonth, parseISO, format as formatDate } from "date-fns"
import {
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  ListFilter,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const BUDGET_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

function apiBudgetToUi(b: ApiBudget, idx: number) {
  return {
    id: b.id,
    category: b.category?.name ?? b.name,
    categoryId: b.category_id,
    name: b.name,
    budget: b.amount,
    rolloverAmount: b.rollover_amount,
    effectiveBudget: b.effective_amount,
    spent: b.spent,
    icon: "💰",
    color: BUDGET_COLORS[idx % BUDGET_COLORS.length],
  }
}

type UiBudget = ReturnType<typeof apiBudgetToUi>


const chartConfig = {
  budgeted: { label: "Budgeted", color: "var(--chart-1)" },
  spent: { label: "Spent", color: "var(--chart-4)" },
} satisfies ChartConfig

function CreateBudgetDialog({
  open,
  onClose,
  onCreated,
  categories,
  onCategoryCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (b: UiBudget) => void
  categories: Category[]
  onCategoryCreated: (category: Category) => void
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [periodType, setPeriodType] = useState("monthly")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const expenseCategories = categories.filter((c) => !c.is_income)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const householdId = await fetchHouseholdId()
      const created = await createCategory({
        household_id: householdId,
        name: newCategoryName.trim(),
        is_income: false,
      })
      onCategoryCreated(created)
      setCategoryId(created.id)
      setNewCategoryName("")
      setAddingCategory(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create category")
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createBudget({
        household_id: householdId,
        name: name.trim(),
        amount: parseFloat(amount),
        period_type: periodType,
        category_id: categoryId !== "none" ? categoryId : undefined,
      })
      const idx = Math.floor(Math.random() * BUDGET_COLORS.length)
      onCreated(apiBudgetToUi(created, idx))
      setName("")
      setAmount("")
      setCategoryId("none")
      setPeriodType("monthly")
      setAddingCategory(false)
      setNewCategoryName("")
      setError("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create budget")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>Set a spending limit for a category</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Budget Name</Label>
            <Input placeholder="e.g. Groceries" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            {addingCategory ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleCreateCategory}>Add</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAddingCategory(false)}>Cancel</Button>
              </div>
            ) : (
              <Select
                value={categoryId}
                onValueChange={(v) => { if (v === "__add_new__") setAddingCategory(true); else setCategoryId(v) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="__add_new__" className="text-primary">+ Add new category…</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditBudgetDialog({
  budget,
  open,
  onClose,
  onUpdated,
  categories,
}: {
  budget: UiBudget | null
  open: boolean
  onClose: () => void
  onUpdated: (b: UiBudget) => void
  categories: Category[]
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (budget) {
      setName(budget.name)
      setAmount(String(budget.budget))
      setCategoryId(budget.categoryId ?? "none")
    }
  }, [budget])

  if (!budget) return null

  const expenseCategories = categories.filter((c) => !c.is_income)

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    setSaving(true)
    setError("")
    try {
      const updated = await updateBudget(budget.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        category_id: categoryId !== "none" ? categoryId : undefined,
      })
      onUpdated({ ...apiBudgetToUi(updated, 0), color: budget.color })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update budget")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update the budget details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Budget Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
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
            <Label>Amount</Label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BudgetDrillSheet({
  budget,
  open,
  onClose,
}: {
  budget: UiBudget | null
  open: boolean
  onClose: () => void
}) {
  const { format } = useCurrency()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !budget?.categoryId) return
    setLoading(true)
    fetchTransactions({ category_id: budget.categoryId, limit: 50, offset: 0 })
      .then((res) => setTxns(res.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, budget])

  if (!budget) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{budget.category} — Transactions</SheetTitle>
          <SheetDescription>
            {format(budget.spent)} spent of {format(budget.effectiveBudget || budget.budget)}
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : txns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {budget.categoryId ? "No transactions found for this budget." : "This budget has no linked category."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.occurred_at).toLocaleDateString()}
                    {t.merchant ? ` · ${t.merchant}` : ""}
                  </p>
                </div>
                <span className="ml-4 tabular-nums text-sm font-semibold text-destructive">
                  {format(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function BudgetsPage() {
  const { format, formatCompact } = useCurrency()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<UiBudget | null>(null)
  const [drillBudget, setDrillBudget] = useState<UiBudget | null>(null)
  const [budgets, setBudgets] = useState<UiBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [periodTxns, setPeriodTxns] = useState<{ occurred_at: string; type: string; amount: number }[]>([])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddDialogOpen(true)
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([fetchBudgets(), fetchCategories()])
      .then(([bdata, cats]) => {
        setBudgets(bdata.map(apiBudgetToUi))
        setCategories(cats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const startDate = startOfMonth(subMonths(new Date(), 6)).toISOString()
    fetchPeriodReport({ start_date: startDate })
      .then((r) => setPeriodTxns(r.transactions))
      .catch(console.error)
  }, [])

  const totalBudget = budgets.reduce((acc, b) => acc + b.budget, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
  const overBudget = budgets.filter((b) => b.spent > b.budget).length
  const underBudget = budgets.filter((b) => b.spent <= b.budget * 0.8).length

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { month: string; year: number; idx: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i))
      months.push({ month: formatDate(d, "MMM"), year: d.getFullYear(), idx: d.getMonth() })
    }
    return months.map(({ month, year, idx }) => {
      const spent = periodTxns
        .filter((t) => {
          const d = parseISO(t.occurred_at)
          return t.type === "expense" && d.getFullYear() === year && d.getMonth() === idx
        })
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      return { month, budgeted: totalBudget, spent: Math.round(spent * 100) / 100 }
    })
  }, [periodTxns, totalBudget])

  const handleCreated = (b: UiBudget) => setBudgets((prev) => [b, ...prev])

  const handleUpdated = (b: UiBudget) => setBudgets((prev) => prev.map((x) => x.id === b.id ? b : x))

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return
    try {
      await deleteBudget(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your spending limits and track progress
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground">{format(totalBudget)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{format(totalSpent)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/10">
                <span className="text-lg">💸</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Over Budget</p>
                <p className="text-2xl font-bold text-destructive">{overBudget}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold text-success">{underBudget}</p>
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
            <CardTitle className="text-base font-semibold">Budget vs Spending</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="budgeted" fill="var(--color-budgeted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Budget Health</CardTitle>
            <CardDescription>Overall spending status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Progress</span>
              <span className="text-sm font-medium text-foreground">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
              </span>
            </div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="h-3" />
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Remaining</span>
                </div>
                <span className="font-medium text-foreground">
                  {format(Math.max(0, totalBudget - totalSpent))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Budgets Over Limit</span>
                </div>
                <span className="font-medium text-foreground">{overBudget}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Budget Categories</CardTitle>
          <CardDescription>Track spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No budgets yet. Create one to get started.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {budgets.map((budget) => {
                const effective = budget.effectiveBudget || budget.budget
                const percentage = effective > 0 ? Math.min((budget.spent / effective) * 100, 100) : 0
                const isOverBudget = budget.spent > effective
                const remaining = effective - budget.spent

                return (
                  <Card key={budget.id} className="relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                            {budget.icon}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{budget.category}</p>
                            <p className="text-xs text-muted-foreground capitalize">{budget.name}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDrillBudget(budget)}>
                              <ListFilter className="mr-2 h-4 w-4" />
                              View Transactions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditBudget(budget)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Budget
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(budget.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-semibold tabular-nums ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
                            {format(budget.spent)}
                          </span>
                          <span className="text-muted-foreground">/ {format(effective)}</span>
                        </div>
                        {budget.rolloverAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {format(budget.budget)} + {format(budget.rolloverAmount)} rolled over
                          </p>
                        )}
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : budget.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className={
                              isOverBudget
                                ? "bg-destructive/10 text-destructive"
                                : remaining < effective * 0.2
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }
                          >
                            {isOverBudget ? (
                              <>
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Over by {format(Math.abs(remaining))}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="mr-1 h-3 w-3" />
                                {format(remaining)} left
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBudgetDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCreated={handleCreated}
        categories={categories}
        onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
      />

      <EditBudgetDialog
        budget={editBudget}
        open={!!editBudget}
        onClose={() => setEditBudget(null)}
        onUpdated={handleUpdated}
        categories={categories}
      />

      <BudgetDrillSheet
        budget={drillBudget}
        open={!!drillBudget}
        onClose={() => setDrillBudget(null)}
      />
    </div>
  )
}
