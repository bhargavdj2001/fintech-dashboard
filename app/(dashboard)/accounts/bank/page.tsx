"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
  ArrowRightLeft,
  RefreshCw,
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { fetchAccounts, type Account as ApiAccount } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const COLORS = [
  { color: "text-chart-1", bgColor: "bg-chart-1" },
  { color: "text-chart-2", bgColor: "bg-chart-2" },
  { color: "text-chart-3", bgColor: "bg-chart-3" },
  { color: "text-chart-4", bgColor: "bg-chart-4" },
  { color: "text-chart-5", bgColor: "bg-chart-5" },
]

type BankAccount = {
  id: string
  name: string
  institution: string
  type: string
  balance: number
  lastSync: string
  accountNumber: string
  icon: typeof Building2
  change: number
  color: string
  bgColor: string
  history: { month: string; balance: number }[]
  recentTransactions: { id: string; title: string; amount: number; date: string; type: string }[]
}

function apiToBank(a: ApiAccount, idx: number): BankAccount {
  return {
    id: a.id,
    name: a.name,
    institution: a.external_id ? `ID: ${a.external_id}` : a.type,
    type: a.type,
    balance: a.balance,
    lastSync: a.last_synced_at ? new Date(a.last_synced_at).toLocaleString() : "—",
    accountNumber: "****",
    icon: a.type === "savings" ? PiggyBank : Building2,
    change: 0,
    color: COLORS[idx % COLORS.length].color,
    bgColor: COLORS[idx % COLORS.length].bgColor,
    history: [],
    recentTransactions: [],
  }
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  useEffect(() => {
    fetchAccounts()
      .then((data) => {
        const mapped = data.map(apiToBank)
        setBankAccounts(mapped)
        if (mapped.length > 0) setSelectedAccount(mapped[0])
      })
      .catch(console.error)
  }, [])

  const totalBalance = bankAccounts.reduce((acc, a) => acc + a.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accounts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bank Accounts</h1>
            <p className="text-sm text-muted-foreground">
              {bankAccounts.length} accounts · ${totalBalance.toLocaleString()} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All Accounts
          </h2>
          {bankAccounts.map((account) => (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all hover:bg-muted/30 ${
                selectedAccount?.id === account.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedAccount(account)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.bgColor}/10`}>
                      <account.icon className={`h-5 w-5 ${account.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.institution} · {account.accountNumber}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">
                    ${account.balance.toLocaleString()}
                  </p>
                  <div className={`flex items-center gap-1 mt-1 text-sm ${
                    account.change >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {account.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {account.change >= 0 ? "+" : ""}{account.change}% this month
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {account.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Synced {account.lastSync}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedAccount ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Select an account to view details.</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{selectedAccount.name}</CardTitle>
                      <CardDescription>Balance history — last 6 months</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-55 w-full">
                    <AreaChart
                      data={selectedAccount.history}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillBankBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--color-balance)"
                        strokeWidth={2}
                        fill="url(#fillBankBalance)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                  <CardDescription>{selectedAccount.name} · last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedAccount.recentTransactions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No recent transactions.</p>
                  ) : (
                    selectedAccount.recentTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              txn.type === "income"
                                ? "bg-success/10"
                                : txn.type === "transfer"
                                ? "bg-primary/10"
                                : "bg-destructive/10"
                            }`}
                          >
                            {txn.type === "income" ? (
                              <ArrowDownLeft className="h-4 w-4 text-success" />
                            ) : txn.type === "transfer" ? (
                              <ArrowRightLeft className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{txn.title}</p>
                            <p className="text-xs text-muted-foreground">{txn.date}</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            txn.amount > 0 ? "text-success" : "text-foreground"
                          }`}
                        >
                          {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="pt-2">
                    <Link href="/transactions">
                      <Button variant="outline" className="w-full">
                        View All Transactions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
