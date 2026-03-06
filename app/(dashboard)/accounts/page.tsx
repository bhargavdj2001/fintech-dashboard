"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ArrowRightLeft,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronRight,
  Banknote,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const accounts = {
  bank: [
    {
      id: "1",
      name: "Primary Checking",
      institution: "Chase Bank",
      type: "checking",
      balance: 12450.75,
      lastSync: "2 min ago",
      accountNumber: "****4521",
      icon: Building2,
      color: "bg-chart-1",
      change: 2.5,
    },
    {
      id: "2",
      name: "High Yield Savings",
      institution: "Marcus",
      type: "savings",
      balance: 45200.0,
      lastSync: "5 min ago",
      accountNumber: "****8892",
      icon: PiggyBank,
      color: "bg-chart-2",
      change: 1.8,
    },
    {
      id: "3",
      name: "Business Checking",
      institution: "Bank of America",
      type: "checking",
      balance: 8750.25,
      lastSync: "1 hour ago",
      accountNumber: "****3341",
      icon: Building2,
      color: "bg-chart-3",
      change: -3.2,
    },
  ],
  credit: [
    {
      id: "4",
      name: "Sapphire Reserve",
      institution: "Chase",
      type: "credit",
      balance: -2340.5,
      limit: 25000,
      lastSync: "10 min ago",
      accountNumber: "****7789",
      icon: CreditCard,
      color: "bg-chart-4",
      dueDate: "Mar 15",
      minPayment: 75,
    },
    {
      id: "5",
      name: "Cash Rewards",
      institution: "Capital One",
      type: "credit",
      balance: -890.25,
      limit: 15000,
      lastSync: "15 min ago",
      accountNumber: "****2234",
      icon: CreditCard,
      color: "bg-chart-5",
      dueDate: "Mar 22",
      minPayment: 25,
    },
  ],
  cash: [
    {
      id: "6",
      name: "Wallet",
      type: "cash",
      balance: 350.0,
      lastUpdated: "Yesterday",
      icon: Banknote,
      color: "bg-success",
    },
    {
      id: "7",
      name: "Safe",
      type: "cash",
      balance: 2000.0,
      lastUpdated: "1 week ago",
      icon: Wallet,
      color: "bg-warning",
    },
  ],
  investment: [
    {
      id: "8",
      name: "Brokerage Account",
      institution: "Fidelity",
      type: "investment",
      balance: 156750.0,
      lastSync: "30 min ago",
      accountNumber: "****5567",
      icon: TrendingUp,
      color: "bg-chart-1",
      change: 8.5,
    },
    {
      id: "9",
      name: "401(k)",
      institution: "Vanguard",
      type: "investment",
      balance: 89500.0,
      lastSync: "1 hour ago",
      accountNumber: "****9901",
      icon: TrendingUp,
      color: "bg-chart-2",
      change: 12.3,
    },
  ],
}

const balanceHistory = [
  { date: "Jan", balance: 52000 },
  { date: "Feb", balance: 54500 },
  { date: "Mar", balance: 53200 },
  { date: "Apr", balance: 58000 },
  { date: "May", balance: 61500 },
  { date: "Jun", balance: 66400 },
]

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function AccountsPage() {
  const [showBalances, setShowBalances] = useState(true)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)

  const totalBank = accounts.bank.reduce((acc, a) => acc + a.balance, 0)
  const totalCredit = accounts.credit.reduce((acc, a) => acc + Math.abs(a.balance), 0)
  const totalCash = accounts.cash.reduce((acc, a) => acc + a.balance, 0)
  const totalInvestment = accounts.investment.reduce((acc, a) => acc + a.balance, 0)
  const netWorth = totalBank + totalCash + totalInvestment - totalCredit

  const formatBalance = (amount: number) => {
    if (!showBalances) return "****"
    return amount < 0 
      ? `-$${Math.abs(amount).toLocaleString()}`
      : `$${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all your financial accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {showBalances ? "Hide" : "Show"} Balances
          </Button>
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>Connect or manually add a financial account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Bank - Checking</SelectItem>
                      <SelectItem value="savings">Bank - Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input id="accountName" placeholder="e.g., Primary Checking" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution (optional)</Label>
                  <Input id="institution" placeholder="e.g., Chase Bank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance</Label>
                  <Input id="balance" type="number" placeholder="0.00" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddAccountOpen(false)}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatBalance(netWorth)}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bank Accounts</p>
            <p className="text-xl font-bold text-foreground">{formatBalance(totalBank)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.bank.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Credit Cards</p>
            <p className="text-xl font-bold text-destructive">-{formatBalance(totalCredit)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.credit.length} cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Investments</p>
            <p className="text-xl font-bold text-foreground">{formatBalance(totalInvestment)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.investment.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Balance History</CardTitle>
            <CardDescription>Total balance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={balanceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  strokeWidth={2}
                  fill="url(#fillBalance)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common account operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer Money
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Accounts
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Link New Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Accounts</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="credit">Credit Cards</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="investment">Investment</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
                  <CardDescription>{accounts.bank.length} accounts</CardDescription>
                </div>
                <Link href="/accounts/bank">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.bank.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}/10`}>
                        <account.icon className={`h-5 w-5 ${account.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.institution}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatBalance(account.balance)}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-xs ${
                        account.change >= 0 ? "text-success" : "text-destructive"
                      }`}>
                        {account.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {account.change >= 0 ? "+" : ""}{account.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Credit Cards</CardTitle>
                  <CardDescription>{accounts.credit.length} cards</CardDescription>
                </div>
                <Link href="/accounts/cards">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.credit.map((account) => {
                  const utilization = (Math.abs(account.balance) / account.limit) * 100
                  return (
                    <div
                      key={account.id}
                      className="rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}/10`}>
                            <account.icon className={`h-5 w-5 ${account.color.replace("bg-", "text-")}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.institution}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums text-destructive">
                            {formatBalance(account.balance)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of ${account.limit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Utilization</span>
                          <span className={`font-medium ${
                            utilization > 30 ? "text-warning" : "text-success"
                          }`}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={utilization} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Due: {account.dueDate}</span>
                          <span>Min: ${account.minPayment}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Cash Accounts</CardTitle>
                  <CardDescription>{accounts.cash.length} accounts</CardDescription>
                </div>
                <Link href="/accounts/cash">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.cash.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}/10`}>
                        <account.icon className={`h-5 w-5 ${account.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">Updated {account.lastUpdated}</p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums text-foreground">
                      {formatBalance(account.balance)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Investment Accounts</CardTitle>
                  <CardDescription>{accounts.investment.length} accounts</CardDescription>
                </div>
                <Link href="/investments">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.investment.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}/10`}>
                        <account.icon className={`h-5 w-5 ${account.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.institution}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatBalance(account.balance)}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-xs text-success">
                        <TrendingUp className="h-3 w-3" />
                        +{account.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
              <CardDescription>All your bank accounts in one place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.bank.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${account.color}/10`}>
                      <account.icon className={`h-6 w-6 ${account.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.institution} • {account.accountNumber}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Synced {account.lastSync}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold tabular-nums text-foreground">
                        {formatBalance(account.balance)}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-sm ${
                        account.change >= 0 ? "text-success" : "text-destructive"
                      }`}>
                        {account.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {account.change >= 0 ? "+" : ""}{account.change}% this month
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Transactions</DropdownMenuItem>
                        <DropdownMenuItem>Transfer Money</DropdownMenuItem>
                        <DropdownMenuItem>Sync Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Credit Cards</CardTitle>
              <CardDescription>Manage your credit cards and balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.credit.map((account) => {
                const utilization = (Math.abs(account.balance) / account.limit) * 100
                return (
                  <div
                    key={account.id}
                    className="rounded-lg border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${account.color}/10`}>
                          <account.icon className={`h-6 w-6 ${account.color.replace("bg-", "text-")}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.institution} • {account.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold tabular-nums text-destructive">
                            {formatBalance(account.balance)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            of ${account.limit.toLocaleString()} limit
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Transactions</DropdownMenuItem>
                            <DropdownMenuItem>Make Payment</DropdownMenuItem>
                            <DropdownMenuItem>Sync Account</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Remove Card</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Utilization</p>
                        <div className="mt-1 space-y-1">
                          <Progress value={utilization} className="h-2" />
                          <p className={`text-sm font-medium ${utilization > 30 ? "text-warning" : "text-success"}`}>
                            {utilization.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Due</p>
                        <p className="text-sm font-medium text-foreground">{account.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Minimum Payment</p>
                        <p className="text-sm font-medium text-foreground">${account.minPayment}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cash Accounts</CardTitle>
              <CardDescription>Track your physical cash and wallets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.cash.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${account.color}/10`}>
                      <account.icon className={`h-6 w-6 ${account.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">Last updated: {account.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {formatBalance(account.balance)}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Update Balance</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Investment Accounts</CardTitle>
              <CardDescription>Your investment portfolio accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.investment.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${account.color}/10`}>
                      <account.icon className={`h-6 w-6 ${account.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.institution} • {account.accountNumber}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Synced {account.lastSync}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold tabular-nums text-foreground">
                        {formatBalance(account.balance)}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-sm text-success">
                        <TrendingUp className="h-4 w-4" />
                        +{account.change}% YTD
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Holdings</DropdownMenuItem>
                        <DropdownMenuItem>View Transactions</DropdownMenuItem>
                        <DropdownMenuItem>Sync Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove Account</DropdownMenuItem>
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
