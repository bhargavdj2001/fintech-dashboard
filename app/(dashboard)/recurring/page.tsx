"use client"

import { useState } from "react"
import {
  Plus,
  Repeat,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play,
  AlertCircle,
  CheckCircle2,
  Clock,
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
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const recurringTransactions = {
  income: [
    {
      id: "1",
      name: "Salary",
      amount: 5200,
      frequency: "Monthly",
      nextDate: "Apr 1, 2024",
      category: "Income",
      account: "Primary Checking",
      status: "active",
      merchant: "Acme Corp",
    },
    {
      id: "2",
      name: "Freelance Retainer",
      amount: 1500,
      frequency: "Monthly",
      nextDate: "Apr 5, 2024",
      category: "Income",
      account: "Business Checking",
      status: "active",
      merchant: "Client ABC",
    },
    {
      id: "3",
      name: "Dividend Income",
      amount: 125,
      frequency: "Quarterly",
      nextDate: "Jun 15, 2024",
      category: "Investment Income",
      account: "Brokerage",
      status: "active",
      merchant: "Vanguard",
    },
  ],
  bills: [
    {
      id: "4",
      name: "Rent",
      amount: 2200,
      frequency: "Monthly",
      nextDate: "Apr 1, 2024",
      category: "Housing",
      account: "Primary Checking",
      status: "active",
      merchant: "Oakwood Apartments",
    },
    {
      id: "5",
      name: "Electric Bill",
      amount: 120,
      frequency: "Monthly",
      nextDate: "Mar 25, 2024",
      category: "Utilities",
      account: "Primary Checking",
      status: "active",
      merchant: "City Power",
    },
    {
      id: "6",
      name: "Internet",
      amount: 79,
      frequency: "Monthly",
      nextDate: "Mar 18, 2024",
      category: "Utilities",
      account: "Credit Card",
      status: "active",
      merchant: "Comcast",
    },
    {
      id: "7",
      name: "Car Insurance",
      amount: 145,
      frequency: "Monthly",
      nextDate: "Mar 20, 2024",
      category: "Insurance",
      account: "Primary Checking",
      status: "active",
      merchant: "Geico",
    },
    {
      id: "8",
      name: "Phone Bill",
      amount: 85,
      frequency: "Monthly",
      nextDate: "Mar 22, 2024",
      category: "Utilities",
      account: "Credit Card",
      status: "active",
      merchant: "Verizon",
    },
  ],
  subscriptions: [
    {
      id: "9",
      name: "Netflix",
      amount: 15.99,
      frequency: "Monthly",
      nextDate: "Mar 15, 2024",
      category: "Entertainment",
      account: "Credit Card",
      status: "active",
      merchant: "Netflix",
    },
    {
      id: "10",
      name: "Spotify",
      amount: 9.99,
      frequency: "Monthly",
      nextDate: "Mar 18, 2024",
      category: "Entertainment",
      account: "Credit Card",
      status: "active",
      merchant: "Spotify",
    },
    {
      id: "11",
      name: "Adobe Creative Cloud",
      amount: 54.99,
      frequency: "Monthly",
      nextDate: "Mar 22, 2024",
      category: "Software",
      account: "Credit Card",
      status: "active",
      merchant: "Adobe",
    },
    {
      id: "12",
      name: "Gym Membership",
      amount: 49,
      frequency: "Monthly",
      nextDate: "Apr 1, 2024",
      category: "Health",
      account: "Credit Card",
      status: "active",
      merchant: "24 Hour Fitness",
    },
    {
      id: "13",
      name: "iCloud Storage",
      amount: 2.99,
      frequency: "Monthly",
      nextDate: "Mar 25, 2024",
      category: "Storage",
      account: "Credit Card",
      status: "active",
      merchant: "Apple",
    },
    {
      id: "14",
      name: "AWS",
      amount: 45,
      frequency: "Monthly",
      nextDate: "Apr 3, 2024",
      category: "Software",
      account: "Business Checking",
      status: "paused",
      merchant: "Amazon",
    },
  ],
  transfers: [
    {
      id: "15",
      name: "Savings Transfer",
      amount: 500,
      frequency: "Monthly",
      nextDate: "Apr 1, 2024",
      category: "Transfer",
      account: "Primary Checking",
      destination: "High Yield Savings",
      status: "active",
    },
    {
      id: "16",
      name: "Investment Contribution",
      amount: 400,
      frequency: "Monthly",
      nextDate: "Apr 5, 2024",
      category: "Transfer",
      account: "Primary Checking",
      destination: "Brokerage",
      status: "active",
    },
    {
      id: "17",
      name: "401(k) Contribution",
      amount: 750,
      frequency: "Bi-weekly",
      nextDate: "Mar 15, 2024",
      category: "Retirement",
      account: "Salary",
      destination: "401(k)",
      status: "active",
    },
  ],
}

const monthlyForecast = [
  { month: "Mar", income: 6825, expenses: 2916 },
  { month: "Apr", income: 6825, expenses: 2916 },
  { month: "May", income: 6825, expenses: 2916 },
  { month: "Jun", income: 6950, expenses: 2916 },
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
} satisfies ChartConfig

export default function RecurringPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const totalMonthlyIncome = recurringTransactions.income.reduce((acc, t) => acc + t.amount, 0)
  const totalMonthlyBills = recurringTransactions.bills.reduce((acc, t) => acc + t.amount, 0)
  const totalSubscriptions = recurringTransactions.subscriptions
    .filter((t) => t.status === "active")
    .reduce((acc, t) => acc + t.amount, 0)
  const totalTransfers = recurringTransactions.transfers.reduce((acc, t) => acc + t.amount, 0)

  const allRecurring = [
    ...recurringTransactions.income,
    ...recurringTransactions.bills,
    ...recurringTransactions.subscriptions,
    ...recurringTransactions.transfers,
  ]

  const upcomingThisWeek = allRecurring
    .filter((t) => t.status === "active")
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recurring income, bills, and subscriptions
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recurring Transaction</DialogTitle>
              <DialogDescription>Set up a new recurring transaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g., Netflix, Rent, Salary" />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddOpen(false)}>Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowDownLeft className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-xl font-bold text-success">+${totalMonthlyIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Bills</p>
                <p className="text-xl font-bold text-destructive">-${totalMonthlyBills.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Repeat className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscriptions</p>
                <p className="text-xl font-bold text-foreground">${totalSubscriptions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto Savings</p>
                <p className="text-xl font-bold text-foreground">${totalTransfers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Forecast</CardTitle>
            <CardDescription>Projected recurring income vs expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={monthlyForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming This Week</CardTitle>
            <CardDescription>Next scheduled transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingThisWeek.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction.name}</p>
                    <p className="text-xs text-muted-foreground">{transaction.nextDate}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    transaction.category === "Income" || transaction.category === "Investment Income"
                      ? "text-success"
                      : "text-foreground"
                  }`}
                >
                  {transaction.category === "Income" || transaction.category === "Investment Income" ? "+" : "-"}$
                  {transaction.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">All Recurring Transactions</CardTitle>
              <CardDescription>{allRecurring.length} total recurring transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allRecurring.slice(0, 8).map((transaction) => {
                const isIncome = transaction.category === "Income" || transaction.category === "Investment Income"
                const isTransfer = transaction.category === "Transfer" || transaction.category === "Retirement"

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isIncome
                            ? "bg-success/10"
                            : isTransfer
                            ? "bg-primary/10"
                            : "bg-destructive/10"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-5 w-5 text-success" />
                        ) : isTransfer ? (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{transaction.name}</p>
                          {transaction.status === "paused" && (
                            <Badge variant="secondary" className="bg-warning/10 text-warning">
                              Paused
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{transaction.frequency}</span>
                          <span>•</span>
                          <span>Next: {transaction.nextDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`font-semibold tabular-nums ${
                            isIncome ? "text-success" : isTransfer ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {isIncome ? "+" : "-"}${transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.account}</p>
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
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {transaction.status === "paused" ? (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recurring Income</CardTitle>
              <CardDescription>Your regular income sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringTransactions.income.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <ArrowDownLeft className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{transaction.merchant}</span>
                        <span>•</span>
                        <span>{transaction.frequency}</span>
                        <span>•</span>
                        <span>Next: {transaction.nextDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold tabular-nums text-success">
                      +${transaction.amount.toLocaleString()}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
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

        <TabsContent value="bills">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Monthly Bills</CardTitle>
              <CardDescription>Your regular monthly expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringTransactions.bills.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                      <ArrowUpRight className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{transaction.merchant}</span>
                        <span>•</span>
                        <span>Due: {transaction.nextDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        ${transaction.amount.toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
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

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Subscriptions</CardTitle>
                  <CardDescription>Manage your subscription services</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Monthly</p>
                  <p className="text-lg font-bold text-foreground">${totalSubscriptions.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringTransactions.subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className={`flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/50 ${
                    subscription.status === "paused" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <Repeat className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{subscription.name}</p>
                        {subscription.status === "paused" && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{subscription.category}</span>
                        <span>•</span>
                        <span>Next: {subscription.nextDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold tabular-nums text-foreground">
                      ${subscription.amount.toFixed(2)}/mo
                    </p>
                    <Switch checked={subscription.status === "active"} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>
                          {subscription.status === "paused" ? "Resume" : "Pause"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Cancel Subscription</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Automatic Transfers</CardTitle>
              <CardDescription>Scheduled savings and investment transfers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringTransactions.transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transfer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{transfer.account}</span>
                        <span>→</span>
                        <span>{transfer.destination}</span>
                        <span>•</span>
                        <span>{transfer.frequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-primary">
                        ${transfer.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Next: {transfer.nextDate}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Pause</DropdownMenuItem>
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
      </Tabs>
    </div>
  )
}
