"use client"

import { useCallback, useEffect, useState } from "react"
import {
  fetchBudgets,
  fetchCategories,
  fetchHouseholdId,
  createBudget,
  updateBudget,
  deleteBudget,
  type Budget as ApiBudget,
  type Category,
} from "@/lib/api"
import {
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

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
    spent: b.spent,
    icon: "💰",
    color: BUDGET_COLORS[idx % BUDGET_COLORS.length],
  }
}

type UiBudget = ReturnType<typeof apiBudgetToUi>

const monthlyData = [
  { month: "Oct", budgeted: 3600, spent: 3200 },
  { month: "Nov", budgeted: 3600, spent: 3450 },
  { month: "Dec", budgeted: 3600, spent: 3050 },
  { month: "Jan", budgeted: 3600, spent: 3800 },
  { month: "Feb", budgeted: 3600, spent: 3300 },
  { month: "Mar", budgeted: 3600, spent: 3550 },
]

const chartConfig = {
  budgeted: { label: "Budgeted", color: "var(--chart-1)" },
  spent: { label: "Spent", color: "var(--chart-4)" },
} satisfies ChartConfig

function CreateBudgetDialog({
  open,
  onClose,
  onCreated,
  categories,
}: {
  open: boolean
  onClose: () => void
  onCreated: (b: UiBudget) => void
  categories: Category[]
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [periodType, setPeriodType] = useState("monthly")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const expenseCategories = categories.filter((c) => !c.is_income)

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

export default function BudgetsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<UiBudget | null>(null)
  const [budgets, setBudgets] = useState<UiBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

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

  const totalBudget = budgets.reduce((acc, b) => acc + b.budget, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
  const overBudget = budgets.filter((b) => b.spent > b.budget).length
  const underBudget = budgets.filter((b) => b.spent <= b.budget * 0.8).length

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
                <p className="text-2xl font-bold text-foreground">${totalBudget.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">${totalSpent.toLocaleString()}</p>
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
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
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
                  ${Math.max(0, totalBudget - totalSpent).toLocaleString()}
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
                const percentage = budget.budget > 0 ? Math.min((budget.spent / budget.budget) * 100, 100) : 0
                const isOverBudget = budget.spent > budget.budget
                const remaining = budget.budget - budget.spent

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
                            ${budget.spent.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">/ ${budget.budget.toLocaleString()}</span>
                        </div>
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
                                : remaining < budget.budget * 0.2
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }
                          >
                            {isOverBudget ? (
                              <>
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Over by ${Math.abs(remaining).toFixed(0)}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="mr-1 h-3 w-3" />
                                ${remaining.toFixed(0)} left
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
      />

      <EditBudgetDialog
        budget={editBudget}
        open={!!editBudget}
        onClose={() => setEditBudget(null)}
        onUpdated={handleUpdated}
        categories={categories}
      />
    </div>
  )
}
