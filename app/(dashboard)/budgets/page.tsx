"use client"

import { useState } from "react"
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const budgets = [
  {
    id: "1",
    category: "Food & Dining",
    budget: 1200,
    spent: 980,
    icon: "🍕",
    color: "bg-chart-1",
    transactions: 45,
  },
  {
    id: "2",
    category: "Transportation",
    budget: 500,
    spent: 420,
    icon: "🚗",
    color: "bg-chart-2",
    transactions: 12,
  },
  {
    id: "3",
    category: "Entertainment",
    budget: 400,
    spent: 380,
    icon: "🎬",
    color: "bg-chart-3",
    transactions: 8,
  },
  {
    id: "4",
    category: "Shopping",
    budget: 600,
    spent: 720,
    icon: "🛍️",
    color: "bg-chart-4",
    transactions: 15,
  },
  {
    id: "5",
    category: "Utilities",
    budget: 300,
    spent: 180,
    icon: "💡",
    color: "bg-chart-5",
    transactions: 4,
  },
  {
    id: "6",
    category: "Healthcare",
    budget: 200,
    spent: 50,
    icon: "🏥",
    color: "bg-chart-1",
    transactions: 2,
  },
  {
    id: "7",
    category: "Personal Care",
    budget: 150,
    spent: 120,
    icon: "💅",
    color: "bg-chart-2",
    transactions: 6,
  },
  {
    id: "8",
    category: "Education",
    budget: 250,
    spent: 200,
    icon: "📚",
    color: "bg-chart-3",
    transactions: 3,
  },
]

const monthlyData = [
  { month: "Jan", budgeted: 3600, spent: 3200 },
  { month: "Feb", budgeted: 3600, spent: 3450 },
  { month: "Mar", budgeted: 3600, spent: 3050 },
  { month: "Apr", budgeted: 3600, spent: 3800 },
  { month: "May", budgeted: 3600, spent: 3300 },
  { month: "Jun", budgeted: 3600, spent: 3550 },
]

const chartConfig = {
  budgeted: {
    label: "Budgeted",
    color: "var(--chart-1)",
  },
  spent: {
    label: "Spent",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export default function BudgetsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const totalBudget = budgets.reduce((acc, b) => acc + b.budget, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
  const overBudget = budgets.filter((b) => b.spent > b.budget).length
  const underBudget = budgets.filter((b) => b.spent <= b.budget * 0.8).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your spending limits and track progress
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for a category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monthly Budget</Label>
                <Input id="amount" type="number" placeholder="0.00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Create Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalBudget.toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  ${totalSpent.toLocaleString()}
                </p>
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
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
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
                {Math.round((totalSpent / totalBudget) * 100)}%
              </span>
            </div>
            <Progress value={(totalSpent / totalBudget) * 100} className="h-3" />
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Under Budget</span>
                </div>
                <span className="font-medium text-foreground">
                  ${(totalBudget - totalSpent).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Remaining Days</span>
                </div>
                <span className="font-medium text-foreground">12 days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Daily Allowance</span>
                </div>
                <span className="font-medium text-foreground">
                  ${Math.round((totalBudget - totalSpent) / 12)}
                </span>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {budgets.map((budget) => {
              const percentage = Math.min((budget.spent / budget.budget) * 100, 100)
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
                          <p className="text-xs text-muted-foreground">
                            {budget.transactions} transactions
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Budget
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Transactions</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-semibold tabular-nums ${
                            isOverBudget ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          ${budget.spent.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          / ${budget.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverBudget ? "bg-destructive" : budget.color
                          }`}
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
                              Over by ${Math.abs(remaining)}
                            </>
                          ) : (
                            <>
                              <TrendingDown className="mr-1 h-3 w-3" />
                              ${remaining} left
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
