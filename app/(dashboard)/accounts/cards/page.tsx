"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useCurrency } from "@/lib/currency"
import {
  fetchAccounts,
  fetchTransactions,
  createAccount,
  deleteAccount,
  fetchHouseholdId,
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


function AddCardDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (a: Account) => void
}) {
  const [name, setName] = useState("")
  const [balance, setBalance] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createAccount({
        household_id: householdId,
        name: name.trim(),
        type: "credit",
        opening_balance: balance ? parseFloat(balance) : 0,
      })
      onCreated(created)
      setName("")
      setBalance("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create card")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Credit Card</DialogTitle>
          <DialogDescription>Manually add a credit card account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Card Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rewards Card" />
          </div>
          <div className="space-y-2">
            <Label>Opening Balance (amount owed)</Label>
            <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="-0.00" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Card"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CreditCardsPage() {
  const { format, formatCompact } = useCurrency()
  const [creditCards, setCreditCards] = useState<Account[]>([])
  const [selectedCard, setSelectedCard] = useState<Account | null>(null)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [allCardTxns, setAllCardTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

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
    fetchTransactions({ account_id: selectedCard.id, limit: 500, offset: 0 })
      .then((res) => setAllCardTxns(res.items))
      .catch(console.error)
  }, [selectedCard])

  const spendingHistory = useMemo(() => {
    const now = new Date()
    const months: { month: string; year: number; idx: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ month: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), idx: d.getMonth() })
    }
    return months.map(({ month, year, idx }) => {
      const spent = allCardTxns
        .filter((t) => {
          const d = new Date(t.occurred_at)
          return t.type === "expense" && d.getFullYear() === year && d.getMonth() === idx
        })
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      return { month, spent: Math.round(spent * 100) / 100 }
    })
  }, [allCardTxns])

  const totalBalance = creditCards.reduce((acc, c) => acc + c.current_balance, 0)

  const handleCreated = (a: Account) => {
    setCreditCards((prev) => [...prev, a])
    setSelectedCard(a)
  }

  const handleRemove = async (card: Account) => {
    if (!confirm(`Remove "${card.name}"?`)) return
    try {
      await deleteAccount(card.id)
      setCreditCards((prev) => prev.filter((c) => c.id !== card.id))
      if (selectedCard?.id === card.id) setSelectedCard(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove card")
    }
  }

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
            <p className="text-muted-foreground">No credit card accounts yet.</p>
            <Button size="sm" className="mt-4" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </CardContent>
        </Card>
        <AddCardDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} />
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
              {creditCards.length} card{creditCards.length !== 1 ? "s" : ""} · {format(totalBalance)} total balance
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-destructive">
              {format(totalBalance)}
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
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(card)
                        }}
                      >
                        Remove Card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-bold text-destructive">
                    {format(card.current_balance)}
                  </p>
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
                <CardDescription>{selectedCard.name} · last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart
                    data={spendingHistory}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      tickFormatter={(value) => formatCompact(value)}
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
                        {format(txn.type === "income" ? txn.amount : -txn.amount, { signDisplay: "exceptZero" })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AddCardDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} />
    </div>
  )
}
