"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCurrency } from "@/lib/currency"
import {
  fetchGoals,
  fetchHouseholdId,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  type Goal,
} from "@/lib/api"
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  PiggyBank,
  Plane,
  Home,
  GraduationCap,
  Car,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

const CATEGORY_ICON: Record<string, typeof Target> = {
  Savings: PiggyBank,
  Travel: Plane,
  Property: Home,
  Home: Home,
  Vehicle: Car,
  Education: GraduationCap,
}

const CATEGORY_COLOR: Record<string, string> = {
  Savings: "bg-chart-1",
  Travel: "bg-chart-2",
  Property: "bg-chart-3",
  Home: "bg-chart-3",
  Vehicle: "bg-chart-4",
  Education: "bg-chart-5",
}

function goalIcon(category: string | null) {
  return CATEGORY_ICON[category ?? ""] ?? Target
}

function goalColor(category: string | null) {
  return CATEGORY_COLOR[category ?? ""] ?? "bg-primary"
}

function CreateGoalDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (g: Goal) => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Savings")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { setError("Enter a valid target amount"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createGoal({
        household_id: householdId,
        name: name.trim(),
        category,
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmount ? parseFloat(currentAmount) : 0,
        monthly_contribution: monthlyContribution ? parseFloat(monthlyContribution) : 0,
        target_date: targetDate || undefined,
        description: description.trim() || undefined,
      })
      onCreated(created)
      setName(""); setCategory("Savings"); setTargetAmount(""); setCurrentAmount("")
      setTargetDate(""); setMonthlyContribution(""); setDescription("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create goal")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>Set a new savings goal to track</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input placeholder="e.g., Emergency Fund, Vacation" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Property">Property</SelectItem>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current Saved</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Contribution</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input placeholder="Brief description of your goal" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Creating..." : "Create Goal"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditGoalDialog({
  goal,
  open,
  onClose,
  onUpdated,
}: {
  goal: Goal | null
  open: boolean
  onClose: () => void
  onUpdated: (g: Goal) => void
}) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (goal) {
      setName(goal.name)
      setTargetAmount(String(goal.target_amount))
      setMonthlyContribution(String(goal.monthly_contribution))
    }
  }, [goal])

  if (!goal) return null

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const updated = await updateGoal(goal.id, {
        name: name.trim(),
        target_amount: targetAmount ? parseFloat(targetAmount) : undefined,
        monthly_contribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
      })
      onUpdated(updated)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update goal")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>Update the goal details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Contribution</Label>
              <Input type="number" step="0.01" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContributeDialog({
  goal,
  open,
  onClose,
  onUpdated,
}: {
  goal: Goal | null
  open: boolean
  onClose: () => void
  onUpdated: (g: Goal) => void
}) {
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!goal) return null

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    setSaving(true)
    setError("")
    try {
      const updated = await contributeToGoal(goal.id, parseFloat(amount))
      onUpdated(updated)
      setAmount("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add contribution")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contribution — {goal.name}</DialogTitle>
          <DialogDescription>Add to your current saved amount</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Contribution"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function GoalsPage() {
  const { format } = useCurrency()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddOpen(true)
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

  const loadGoals = useCallback(() => {
    setLoading(true)
    fetchGoals()
      .then((data) => {
        setGoals(data)
        setSelectedGoal((prev) => prev && data.some((g) => g.id === prev.id) ? prev : data[0] ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0)
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0)
  const onTrackCount = goals.filter((g) => g.status === "on-track" || g.status === "completed").length
  const totalMonthlyContribution = goals.reduce((acc, g) => acc + g.monthly_contribution, 0)

  const handleCreated = (g: Goal) => setGoals((prev) => [g, ...prev])
  const handleUpdated = (g: Goal) => setGoals((prev) => prev.map((x) => x.id === g.id ? g : x))

  const handleDelete = async (goal: Goal) => {
    if (!confirm(`Delete "${goal.name}"?`)) return
    try {
      await deleteGoal(goal.id)
      setGoals((prev) => prev.filter((g) => g.id !== goal.id))
      if (selectedGoal?.id === goal.id) setSelectedGoal(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete goal")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track progress towards your savings goals
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold text-foreground">{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold text-foreground">{format(totalSaved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold text-foreground">{onTrackCount}/{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p className="text-2xl font-bold text-foreground">{format(totalMonthlyContribution)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading goals...</p>
      ) : goals.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No goals yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
            {goals.map((goal) => {
              const Icon = goalIcon(goal.category)
              const color = goalColor(goal.category)
              const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
              const remaining = Math.max(0, goal.target_amount - goal.current_amount)

              return (
                <Card
                  key={goal.id}
                  className={`cursor-pointer transition-all ${
                    selectedGoal?.id === goal.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}/10`}>
                          <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{goal.name}</p>
                            <Badge
                              variant="secondary"
                              className={
                                goal.status === "behind"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                              }
                            >
                              {goal.status === "behind" ? (
                                <AlertCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              )}
                              {goal.status === "completed" ? "Completed" : goal.status === "behind" ? "Behind" : "On Track"}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditGoal(goal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setContributeGoal(goal)}>
                            Add Contribution
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(goal)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">
                          {format(goal.current_amount)}
                        </span>
                        <span className="text-muted-foreground">
                          of {format(goal.target_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-sm font-medium text-foreground">{format(remaining)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly</p>
                        <p className="text-sm font-medium text-foreground">{format(goal.monthly_contribution)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="text-sm font-medium text-foreground">
                          {goal.target_date ? new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Progress</span>
                    <span className="font-medium text-foreground">
                      {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="h-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{format(totalSaved)}</span>
                    <span className="text-muted-foreground">of {format(totalTarget)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-sm font-semibold text-foreground">
                      {format(Math.max(0, totalTarget - totalSaved))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Savings</p>
                    <p className="text-sm font-semibold text-foreground">
                      {format(totalMonthlyContribution)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedGoal && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${goalColor(selectedGoal.category)}/10`}>
                      {(() => { const Icon = goalIcon(selectedGoal.category); return <Icon className={`h-5 w-5 ${goalColor(selectedGoal.category).replace("bg-", "text-")}`} /> })()}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{selectedGoal.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedGoal.category ?? "—"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-medium text-foreground">{format(selectedGoal.current_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium text-foreground">{format(selectedGoal.target_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly contribution</span>
                    <span className="font-medium text-foreground">{format(selectedGoal.monthly_contribution)}</span>
                  </div>
                  <Button size="sm" className="w-full mt-2" onClick={() => setContributeGoal(selectedGoal)}>
                    Add Contribution
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <CreateGoalDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} />
      <EditGoalDialog goal={editGoal} open={!!editGoal} onClose={() => setEditGoal(null)} onUpdated={handleUpdated} />
      <ContributeDialog goal={contributeGoal} open={!!contributeGoal} onClose={() => setContributeGoal(null)} onUpdated={handleUpdated} />
    </div>
  )
}
