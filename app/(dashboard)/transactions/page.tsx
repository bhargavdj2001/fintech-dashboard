"use client"

import { useCallback, useEffect, useState } from "react"
import {
  fetchTransactions,
  fetchAccounts,
  fetchCategories,
  fetchHouseholdId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Account,
  type Category,
  type Transaction as ApiTransaction,
} from "@/lib/api"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  X,
  Tag,
  Building2,
  Calendar,
  Receipt,
  SplitSquareHorizontal,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type TransactionType = "income" | "expense" | "transfer"
type TransactionStatus = "posted" | "pending"

interface Transaction {
  id: string
  title: string
  description: string
  category: string
  categoryId: string | null
  amount: number
  type: TransactionType
  date: string
  merchant: string
  account: string
  accountId: string
  householdId: string
  status: TransactionStatus
  notes?: string
}

function apiToUi(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    category: t.category?.name ?? "Uncategorized",
    categoryId: t.category_id,
    amount: t.type === "income" ? t.amount : -Math.abs(t.amount),
    type: t.type as TransactionType,
    date: t.occurred_at,
    merchant: t.merchant ?? t.account?.name ?? "—",
    account: t.account?.name ?? "—",
    accountId: t.account_id,
    householdId: t.household_id,
    status: (t.status === "cleared" ? "posted" : t.status ?? "posted") as TransactionStatus,
    notes: t.description ?? undefined,
  }
}

function TransactionDetailSheet({
  transaction,
  open,
  onClose,
  onSaved,
  onDeleted,
  categories,
}: {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
  onSaved: (updated: Transaction) => void
  onDeleted: (id: string) => void
  categories: Category[]
}) {
  const [title, setTitle] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title)
      setMerchant(transaction.merchant === "—" ? "" : transaction.merchant)
      setCategoryId(transaction.categoryId ?? "none")
      setStatus(transaction.status)
      setNotes(transaction.notes ?? "")
    }
  }, [transaction])

  if (!transaction) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateTransaction(transaction.id, {
        title: title.trim() || undefined,
        merchant: merchant.trim() || undefined,
        category_id: categoryId && categoryId !== "none" ? categoryId : undefined,
        status: status === "posted" ? "cleared" : "pending",
        description: notes.trim() || undefined,
      })
      onSaved(apiToUi(updated))
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return
    setDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      onDeleted(transaction.id)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                transaction.type === "income"
                  ? "bg-success/10"
                  : transaction.type === "transfer"
                  ? "bg-primary/10"
                  : "bg-destructive/10"
              }`}
            >
              {transaction.type === "income" ? (
                <ArrowDownLeft className="h-5 w-5 text-success" />
              ) : transaction.type === "transfer" ? (
                <ArrowUpDown className="h-5 w-5 text-primary" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <SheetTitle className="text-left">{transaction.title}</SheetTitle>
              <SheetDescription className="text-left font-mono text-xs">{transaction.id}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Amount */}
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p
              className={`text-3xl font-bold tabular-nums ${
                transaction.type === "income"
                  ? "text-success"
                  : transaction.type === "transfer"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {transaction.amount > 0 ? "+" : ""}$
              {Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge
                variant="secondary"
                className={
                  transaction.status === "posted"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }
              >
                {transaction.status === "posted" ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Clock className="mr-1 h-3 w-3" />
                )}
                {transaction.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Edit fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Edit Details</h3>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Merchant</Label>
              <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-medium">
                  {new Date(transaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="font-medium mt-1">{transaction.account}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "..." : "Delete"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AddTransactionDialog({
  open,
  onClose,
  onCreated,
  accounts,
  categories,
}: {
  open: boolean
  onClose: () => void
  onCreated: (txn: Transaction) => void
  accounts: Account[]
  categories: Category[]
}) {
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id)
  }, [accounts])

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    if (!accountId) { setError("Select an account"); return }

    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createTransaction({
        household_id: householdId,
        account_id: accountId,
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        occurred_at: new Date(date).toISOString(),
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId !== "none" ? categoryId : undefined,
        status: "cleared",
        currency: "USD",
      })
      onCreated(apiToUi(created))
      // Reset
      setType("expense")
      setAmount("")
      setTitle("")
      setMerchant("")
      setCategoryId("none")
      setDate(new Date().toISOString().split("T")[0])
      setDescription("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create transaction")
    } finally {
      setSaving(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.is_income : !c.is_income
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new financial transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v as typeof type); setCategoryId("none") }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Transaction title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Merchant</Label>
            <Input placeholder="Merchant or payee name" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Adding..." : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetchTransactions({ limit: 200, offset: 0 }),
      fetchAccounts(),
      fetchCategories(),
    ])
      .then(([res, accts, cats]) => {
        setTransactions(res.items.map(apiToUi))
        setAccounts(accts)
        setCategories(cats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category))).sort()

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + Math.abs(t.amount), 0)

  const openDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailOpen(true)
  }

  const handleSaved = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => t.id === updated.id ? updated : t))
  }

  const handleDeleted = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCreated = (txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all your financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">
                  +${totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowDownLeft className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  -${totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Cashflow</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalIncome - totalExpenses).toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowUpDown className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="w-[220px] pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(transaction)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            transaction.type === "income"
                              ? "bg-success/10"
                              : transaction.type === "transfer"
                              ? "bg-primary/10"
                              : "bg-destructive/10"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownLeft className="h-4 w-4 text-success" />
                          ) : transaction.type === "transfer" ? (
                            <ArrowUpDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.title}</p>
                          <p className="text-xs text-muted-foreground">{transaction.merchant}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{transaction.account}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          transaction.status === "posted"
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : "bg-warning/10 text-warning hover:bg-warning/20"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          transaction.type === "income"
                            ? "text-success"
                            : transaction.type === "transfer"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}$
                        {Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(transaction) }}>
                            View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm("Delete this transaction?")) return
                              try {
                                await deleteTransaction(transaction.id)
                                handleDeleted(transaction.id)
                              } catch (err) { console.error(err) }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionDetailSheet
        transaction={selectedTransaction}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        categories={categories}
      />

      <AddTransactionDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={handleCreated}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
