"use client"

import { useState } from "react"
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
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const goals = [
  {
    id: "1",
    name: "Emergency Fund",
    target: 15000,
    current: 12500,
    deadline: "Jun 2024",
    icon: PiggyBank,
    color: "bg-chart-1",
    category: "Savings",
    monthlyContribution: 500,
    status: "on-track",
    description: "6 months of living expenses",
    history: [
      { month: "Oct", amount: 10000 },
      { month: "Nov", amount: 10500 },
      { month: "Dec", amount: 11200 },
      { month: "Jan", amount: 11700 },
      { month: "Feb", amount: 12100 },
      { month: "Mar", amount: 12500 },
    ],
  },
  {
    id: "2",
    name: "Summer Vacation",
    target: 5000,
    current: 3200,
    deadline: "Jul 2024",
    icon: Plane,
    color: "bg-chart-2",
    category: "Travel",
    monthlyContribution: 450,
    status: "on-track",
    description: "Trip to Europe with family",
    history: [
      { month: "Oct", amount: 1500 },
      { month: "Nov", amount: 1900 },
      { month: "Dec", amount: 2300 },
      { month: "Jan", amount: 2650 },
      { month: "Feb", amount: 2900 },
      { month: "Mar", amount: 3200 },
    ],
  },
  {
    id: "3",
    name: "Down Payment",
    target: 60000,
    current: 28500,
    deadline: "Dec 2025",
    icon: Home,
    color: "bg-chart-3",
    category: "Property",
    monthlyContribution: 1500,
    status: "on-track",
    description: "20% down payment for home",
    history: [
      { month: "Oct", amount: 22000 },
      { month: "Nov", amount: 23500 },
      { month: "Dec", amount: 25000 },
      { month: "Jan", amount: 26500 },
      { month: "Feb", amount: 27500 },
      { month: "Mar", amount: 28500 },
    ],
  },
  {
    id: "4",
    name: "New Car Fund",
    target: 10000,
    current: 4500,
    deadline: "Dec 2024",
    icon: Car,
    color: "bg-chart-4",
    category: "Vehicle",
    monthlyContribution: 600,
    status: "behind",
    description: "Down payment for new vehicle",
    history: [
      { month: "Oct", amount: 2000 },
      { month: "Nov", amount: 2500 },
      { month: "Dec", amount: 3000 },
      { month: "Jan", amount: 3500 },
      { month: "Feb", amount: 4000 },
      { month: "Mar", amount: 4500 },
    ],
  },
  {
    id: "5",
    name: "Education Fund",
    target: 25000,
    current: 8200,
    deadline: "Sep 2026",
    icon: GraduationCap,
    color: "bg-chart-5",
    category: "Education",
    monthlyContribution: 500,
    status: "on-track",
    description: "Professional certification courses",
    history: [
      { month: "Oct", amount: 5500 },
      { month: "Nov", amount: 6100 },
      { month: "Dec", amount: 6700 },
      { month: "Jan", amount: 7300 },
      { month: "Feb", amount: 7800 },
      { month: "Mar", amount: 8200 },
    ],
  },
]

const chartConfig = {
  amount: {
    label: "Saved",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function GoalsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(goals[0])

  const totalTarget = goals.reduce((acc, g) => acc + g.target, 0)
  const totalSaved = goals.reduce((acc, g) => acc + g.current, 0)
  const onTrackCount = goals.filter((g) => g.status === "on-track").length
  const totalMonthlyContribution = goals.reduce((acc, g) => acc + g.monthlyContribution, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financial Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track progress towards your savings goals
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings goal to track</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input placeholder="e.g., Emergency Fund, Vacation" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Amount</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Current Saved</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Contribution</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input placeholder="Brief description of your goal" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddOpen(false)}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <p className="text-2xl font-bold text-foreground">${totalSaved.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">${totalMonthlyContribution.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
          {goals.map((goal) => {
            const percentage = (goal.current / goal.target) * 100
            const remaining = goal.target - goal.current
            const monthsToGoal = Math.ceil(remaining / goal.monthlyContribution)

            return (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all ${
                  selectedGoal.id === goal.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedGoal(goal)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${goal.color}/10`}>
                        <goal.icon className={`h-6 w-6 ${goal.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{goal.name}</p>
                          <Badge
                            variant="secondary"
                            className={
                              goal.status === "on-track"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }
                          >
                            {goal.status === "on-track" ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                              <AlertCircle className="mr-1 h-3 w-3" />
                            )}
                            {goal.status === "on-track" ? "On Track" : "Behind"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Goal
                        </DropdownMenuItem>
                        <DropdownMenuItem>Add Contribution</DropdownMenuItem>
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
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${goal.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">
                        ${goal.current.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        of ${goal.target.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-sm font-medium text-foreground">${remaining.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="text-sm font-medium text-foreground">${goal.monthlyContribution}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-sm font-medium text-foreground">{goal.deadline}</p>
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
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedGoal.color}/10`}>
                  <selectedGoal.icon className={`h-5 w-5 ${selectedGoal.color.replace("bg-", "text-")}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{selectedGoal.name}</CardTitle>
                  <CardDescription>{selectedGoal.category}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={selectedGoal.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillGoal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    strokeWidth={2}
                    fill="url(#fillGoal)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Goal Insights</CardTitle>
              <CardDescription>AI-powered recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">On track for early completion</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    At your current savings rate, you'll reach your Emergency Fund goal 2 weeks early!
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Increase monthly contribution</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adding $100/month to your New Car Fund would get you back on track.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
                <Target className="h-5 w-5 flex-shrink-0 text-chart-2" />
                <div>
                  <p className="text-sm font-medium text-foreground">Prioritize goals</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider focusing on your Emergency Fund before vacation savings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Overall Progress</CardTitle>
              <CardDescription>Combined goal progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Progress</span>
                  <span className="font-medium text-foreground">
                    {((totalSaved / totalTarget) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(totalSaved / totalTarget) * 100} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">${totalSaved.toLocaleString()}</span>
                  <span className="text-muted-foreground">of ${totalTarget.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${(totalTarget - totalSaved).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Savings</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${totalMonthlyContribution.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
