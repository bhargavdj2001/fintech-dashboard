"use client"

import { useCallback, useEffect, useState } from "react"
import { useCurrency } from "@/lib/currency"
import {
  fetchInvestments,
  fetchAccounts,
  fetchHouseholdId,
  createInvestment,
  deleteInvestment,
  createInvestmentTransaction,
  type Investment,
  type Account,
} from "@/lib/api"
import { Plus, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const INSTRUMENT_OPTIONS = ["stock", "etf", "mutual_fund", "crypto", "bond", "gold"] as const

const ALLOCATION_COLORS: Record<string, string> = {
  stock: "var(--chart-1)",
  etf: "var(--chart-2)",
  mutual_fund: "var(--chart-3)",
  bond: "var(--chart-4)",
  crypto: "var(--chart-5)",
  gold: "var(--muted)",
}

type Holding = {
  id: string
  name: string
  instrument: string
  units: number
  avgPrice: number
  value: number
}

function computeHolding(inv: Investment): Holding {
  let totalUnits = 0
  let totalCost = 0
  for (const t of inv.investment_transactions) {
    if (t.txn_type === "buy" && t.units && t.price_per_unit) {
      totalUnits += t.units
      totalCost += t.units * t.price_per_unit
    } else if (t.txn_type === "sell" && t.units) {
      totalUnits -= t.units
    }
  }
  const avgPrice = totalUnits > 0 ? totalCost / totalUnits : 0
  return {
    id: inv.id,
    name: inv.name,
    instrument: inv.instrument ?? "—",
    units: totalUnits,
    avgPrice,
    value: totalUnits * avgPrice,
  }
}

function buildCostBasisHistory(investments: Investment[]) {
  const events = investments
    .flatMap((inv) => inv.investment_transactions)
    .filter((t) => t.units && t.price_per_unit)
    .map((t) => ({
      date: new Date(t.occurred_at),
      delta: (t.txn_type === "sell" ? -1 : 1) * (t.units! * t.price_per_unit!),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  let running = 0
  const byMonth = new Map<string, number>()
  for (const e of events) {
    running += e.delta
    const key = e.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    byMonth.set(key, running)
  }
  return Array.from(byMonth.entries()).map(([date, value]) => ({ date, value }))
}

const chartConfig = {
  value: { label: "Cost Basis", color: "var(--chart-1)" },
} satisfies ChartConfig

function AddInvestmentDialog({
  open,
  onClose,
  onCreated,
  accounts,
}: {
  open: boolean
  onClose: () => void
  onCreated: (i: Investment) => void
  accounts: Account[]
}) {
  const [name, setName] = useState("")
  const [instrument, setInstrument] = useState<string>("stock")
  const [accountId, setAccountId] = useState("none")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const investmentAccounts = accounts.filter((a) => a.type === "investment")

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createInvestment({
        household_id: householdId,
        name: name.trim(),
        instrument: instrument as "stock" | "etf" | "mutual_fund" | "crypto" | "bond" | "gold",
        account_id: accountId !== "none" ? accountId : undefined,
      })
      onCreated(created)
      setName("")
      setInstrument("stock")
      setAccountId("none")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create investment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>Add a new holding to track</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apple Inc." />
          </div>
          <div className="space-y-2">
            <Label>Instrument Type</Label>
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTRUMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Linked Account (optional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {investmentAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Investment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddTransactionDialog({
  investment,
  open,
  onClose,
  onUpdated,
}: {
  investment: Investment | null
  open: boolean
  onClose: () => void
  onUpdated: (i: Investment) => void
}) {
  const [txnType, setTxnType] = useState<"buy" | "sell" | "dividend">("buy")
  const [units, setUnits] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!investment) return null

  const handleSubmit = async () => {
    setSaving(true)
    setError("")
    try {
      const updated = await createInvestmentTransaction(investment.id, {
        txn_type: txnType,
        units: units ? parseFloat(units) : undefined,
        price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
        occurred_at: new Date(occurredAt).toISOString(),
      })
      onUpdated(updated)
      setUnits("")
      setPricePerUnit("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add transaction")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction — {investment.name}</DialogTitle>
          <DialogDescription>Record a buy, sell, or dividend</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={txnType} onValueChange={(v) => setTxnType(v as "buy" | "sell" | "dividend")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="dividend">Dividend</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {txnType !== "dividend" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Units</Label>
                <Input type="number" step="0.0001" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Price / Unit</Label>
                <Input type="number" step="0.01" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Transaction"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InvestmentsPage() {
  const { format, formatCompact } = useCurrency()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [txnTarget, setTxnTarget] = useState<Investment | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([fetchInvestments(), fetchAccounts()])
      .then(([inv, acc]) => {
        setInvestments(inv)
        setAccounts(acc)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const holdings = investments.map(computeHolding)
  const totalValue = holdings.reduce((acc, h) => acc + h.value, 0)
  const costBasisHistory = buildCostBasisHistory(investments)

  const allocationMap = new Map<string, number>()
  for (const h of holdings) {
    allocationMap.set(h.instrument, (allocationMap.get(h.instrument) ?? 0) + h.value)
  }
  const allocationData = Array.from(allocationMap.entries())
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value, color: ALLOCATION_COLORS[name] ?? "var(--muted)" }))

  const handleCreated = (inv: Investment) => setInvestments((prev) => [inv, ...prev])

  const handleTxnUpdated = (inv: Investment) =>
    setInvestments((prev) => prev.map((i) => i.id === inv.id ? inv : i))

  const handleRemove = async (inv: Investment) => {
    if (!confirm(`Remove "${inv.name}"?`)) return
    try {
      await deleteInvestment(inv.id)
      setInvestments((prev) => prev.filter((i) => i.id !== inv.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove investment")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Investments</h1>
          <p className="text-sm text-muted-foreground">
            Track your portfolio performance and holdings
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-3xl font-bold text-foreground">{format(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">based on weighted average buy price</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Holdings</p>
            <p className="text-2xl font-bold text-foreground">{holdings.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cost Basis Over Time</CardTitle>
            <CardDescription>Cumulative invested amount from recorded transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {costBasisHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No transactions recorded yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={costBasisHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} fill="url(#fillValue)" />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Asset Allocation</CardTitle>
            <CardDescription>Distribution by instrument type</CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No holdings yet.</p>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <div className="relative h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-lg font-bold text-foreground">{formatCompact(totalValue)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground capitalize">{item.name.replace("_", " ")}</span>
                      </div>
                      <span className="font-medium tabular-nums text-foreground">{format(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Holdings</CardTitle>
          <CardDescription>All your investment holdings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading investments...</p>
          ) : holdings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No investments yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Avg. Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => {
                  const inv = investments.find((i) => i.id === holding.id)!
                  return (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{holding.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal capitalize">
                          {holding.instrument.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {holding.units}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {format(holding.avgPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">
                        {format(holding.value)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTxnTarget(inv)}>
                              Add Transaction
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(inv)}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddInvestmentDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} accounts={accounts} />
      <AddTransactionDialog investment={txnTarget} open={!!txnTarget} onClose={() => setTxnTarget(null)} onUpdated={handleTxnUpdated} />
    </div>
  )
}
