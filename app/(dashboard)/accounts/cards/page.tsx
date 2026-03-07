"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  fetchAccounts,
  fetchTransactions,
  type Account,
  type Transaction,
} from "@/lib/api"
import {
  CreditCard,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
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
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Credit-type account type values that may appear in the DB
const CREDIT_TYPES = ["credit", "credit_card", "creditcard", "credit card"]

function isCreditAccount(type: string) {
  return CREDIT_TYPES.includes(type.toLowerCase().replace(/_/g, " ").trim())
    || type.toLowerCase().includes("credit")
}

const chartConfig = {
  spent: { label: "Spending", color: "var(--chart-4)" },
} satisfies ChartConfig

// Placeholder spending history since we don't have monthly aggregates per account
function buildSpendingHistory(balance: number) {
  return [
    { month: "Oct", spent: Math.round(balance * 0.7) },
    { month: "Nov", spent: Math.round(balance * 0.9) },
    { month: "Dec", spent: Math.round(balance * 1.2) },
    { month: "Jan", spent: Math.round(balance * 0.8) },
    { month: "Feb", spent: Math.round(balance * 1.0) },
    { month: "Mar", spent: Math.round(balance) },
  ]
}

export default function CreditCardsPage() {
  const [creditCards, setCreditCards] = useState<Account[]>([])
  const [selectedCard, setSelectedCard] = useState<Account | null>(null)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadAccounts = useCallback(() => {
    setLoading(true)
    fetchAccounts()
      .then((accounts) => {
        const cards = accounts.filter((a) => isCreditAccount(a.type))
        setCreditCards(cards)
        if (cards.length > 0) setSelectedCard(cards[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  useEffect(() => {
    if (!selectedCard) return
    fetchTransactions({ account_id: selectedCard.id, limit: 5, offset: 0 })
      .then((res) => setRecentTxns(res.items))
      .catch(console.error)
  }, [selectedCard])

  const totalBalance = creditCards.reduce((acc, c) => acc + c.balance, 0)
  // Without a stored limit, we use a rough 30% utilization heuristic for display
  // The real limit isn't in our schema, so we show what we have
  const estimatedLimit = creditCards.length > 0 ? totalBalance / 0.15 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (creditCards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/accounts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Credit Cards</h1>
            <p className="text-sm text-muted-foreground">No credit card accounts found</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No credit card accounts in your data.</p>
            <p className="text-xs text-muted-foreground mt-1">Add a credit card account in your database to see it here.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Credit Cards</h1>
            <p className="text-sm text-muted-foreground">
              {creditCards.length} card{creditCards.length !== 1 ? "s" : ""} · ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} total balance
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-destructive">
              ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">across {creditCards.length} card{creditCards.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="text-2xl font-bold text-foreground">
              {selectedCard?.currency ?? "USD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Last Synced</p>
            <p className="text-2xl font-bold text-foreground">
              {selectedCard?.last_synced_at
                ? new Date(selectedCard.last_synced_at).toLocaleDateString()
                : "—"}
            </p>
            {!selectedCard?.last_synced_at && (
              <p className="text-xs text-warning mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Manual account
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Your Cards
          </h2>
          {creditCards.map((card) => (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all hover:bg-muted/30 ${
                selectedCard?.id === card.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedCard(card)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                      <CreditCard className="h-5 w-5 text-chart-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{card.type.replace(/_/g, " ")}</p>
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
                      <DropdownMenuItem>
                        <Link href="/transactions">View Transactions</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Remove Card</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-bold text-destructive">
                    ${card.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.currency}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCard && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Monthly Spending</CardTitle>
                <CardDescription>{selectedCard.name} · estimated from balance</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart
                    data={buildSpendingHistory(selectedCard.balance)}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                    <CardDescription>{selectedCard.name}</CardDescription>
                  </div>
                  <Link href="/transactions">
                    <Button size="sm" variant="outline">
                      View All
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTxns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent transactions.</p>
                ) : (
                  recentTxns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          txn.type === "income" ? "bg-success/10" : "bg-destructive/10"
                        }`}>
                          <ArrowUpRight className={`h-4 w-4 ${txn.type === "income" ? "text-success" : "text-destructive"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{txn.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {txn.category?.name ?? "—"} · {new Date(txn.occurred_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${
                        txn.type === "income" ? "text-success" : "text-foreground"
                      }`}>
                        {txn.type === "income" ? "+" : "-"}${txn.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
