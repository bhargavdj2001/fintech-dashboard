"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCurrency } from "@/lib/currency"
import {
  fetchTransactions,
  fetchAccounts,
  fetchCategories,
  fetchHouseholdId,
  createTransaction,
  createTransfer,
  uploadReceipt,
  deleteReceipt,
  API_BASE_URL,
  createCategory,
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
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
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
  transferGroupId: string | null
  receiptUrl: string | null
}

function apiToUi(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    category: t.category?.name ?? "Uncategorized",
    categoryId: t.category_id,
    // transfer rows are already signed correctly (negative=outflow, positive=inflow)
    amount: t.type === "income" ? t.amount : t.type === "transfer" ? t.amount : -Math.abs(t.amount),
    type: t.type as TransactionType,
    date: t.occurred_at,
    merchant: t.merchant ?? t.account?.name ?? "—",
    account: t.account?.name ?? "—",
    accountId: t.account_id,
    householdId: t.household_id,
    status: (t.status === "cleared" ? "posted" : t.status ?? "posted") as TransactionStatus,
    notes: t.description ?? undefined,
    transferGroupId: t.transfer_group_id,
    receiptUrl: t.receipt_url,
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
  onDeleted: (ids: string[]) => void
  categories: Category[]
}) {
  const { format } = useCurrency()
  const [title, setTitle] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title)
      setMerchant(transaction.merchant === "—" ? "" : transaction.merchant)
      setCategoryId(transaction.categoryId ?? "none")
      setStatus(transaction.status)
      setNotes(transaction.notes ?? "")
      setReceiptUrl(transaction.receiptUrl)
    }
  }, [transaction])

  if (!transaction) return null

  const handleUploadReceipt = async (file: File) => {
    setUploadingReceipt(true)
    try {
      const updated = await uploadReceipt(transaction.id, file)
      setReceiptUrl(updated.receipt_url)
      onSaved(apiToUi(updated))
    } catch (err) {
      console.error(err)
      alert("Failed to upload receipt")
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = async () => {
    if (!confirm("Remove this receipt?")) return
    setUploadingReceipt(true)
    try {
      const updated = await deleteReceipt(transaction.id)
      setReceiptUrl(null)
      onSaved(apiToUi(updated))
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingReceipt(false)
    }
  }

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
    const msg = transaction.transferGroupId
      ? "Delete this transfer? Both sides (the debit and the credit) will be removed."
      : "Delete this transaction?"
    if (!confirm(msg)) return
    setDeleting(true)
    try {
      const result = await deleteTransaction(transaction.id)
      onDeleted(result.deleted_ids)
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
              {format(transaction.amount, { signDisplay: "exceptZero" })}
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

          {/* Edit fields — transfers are immutable (delete + recreate instead) */}
          {transaction.transferGroupId ? (
            <p className="text-sm text-muted-foreground">
              This is a transfer between two accounts. Transfers can&apos;t be edited — delete it and create a new one if you need to change it.
            </p>
          ) : (
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
          )}

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

          {!transaction.transferGroupId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Receipt</Label>
                {receiptUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    {receiptUrl.endsWith(".pdf") ? (
                      <a
                        href={`${API_BASE_URL}${receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                      >
                        View receipt (PDF)
                      </a>
                    ) : (
                      <img
                        src={`${API_BASE_URL}${receiptUrl}`}
                        alt="Receipt"
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={handleRemoveReceipt}
                      disabled={uploadingReceipt}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      id="receipt-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadReceipt(file)
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingReceipt}
                      onClick={() => document.getElementById("receipt-upload")?.click()}
                    >
                      {uploadingReceipt ? "Uploading..." : "Attach Receipt"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            {!transaction.transferGroupId && (
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
            <Button
              variant="outline"
              className={transaction.transferGroupId ? "flex-1 text-destructive hover:text-destructive" : "text-destructive hover:text-destructive"}
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
  onCategoryCreated,
  defaultType,
}: {
  open: boolean
  onClose: () => void
  onCreated: (txn: Transaction) => void
  accounts: Account[]
  categories: Category[]
  onCategoryCreated: (category: Category) => void
  defaultType?: "income" | "expense" | "transfer"
}) {
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState("none")
  const [accountId, setAccountId] = useState("")
  const [toAccountId, setToAccountId] = useState("")

  // Apply the requested default type whenever the dialog is opened (e.g. via
  // the command palette's "Transfer Money" quick action).
  useEffect(() => {
    if (open && defaultType) setType(defaultType)
  }, [open, defaultType])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Re-initialize account selection every time the dialog opens
  useEffect(() => {
    if (!open) return
    if (accounts.length > 0) {
      setAccountId(accounts[0].id)
      if (accounts.length > 1)
        setToAccountId(accounts.find((a) => a.id !== accounts[0].id)?.id ?? "")
    }
  }, [open, accounts])

  const handleSubmit = async () => {
    if (type !== "transfer" && !title.trim()) { setError("Title is required"); return }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setError("Enter a valid amount > 0"); return }
    if (!accountId) { setError(type === "transfer" ? "Select a from account" : "Select an account"); return }

    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      if (type === "transfer") {
        if (!toAccountId) { setError("Select a to account"); setSaving(false); return }
        if (toAccountId === accountId) { setError("From and To accounts must differ"); setSaving(false); return }
        const result = await createTransfer({
          household_id: householdId,
          from_account_id: accountId,
          to_account_id: toAccountId,
          title: title.trim() || undefined,
          amount: parseFloat(amount),
          occurred_at: new Date(date).toISOString(),
          status: "cleared",
        })
        onCreated(apiToUi(result.from_transaction))
        onCreated(apiToUi(result.to_transaction))
      } else {
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
        })
        onCreated(apiToUi(created))
      }
      // Reset
      setType("expense")
      setAmount("")
      setTitle("")
      setMerchant("")
      setCategoryId("none")
      setDate(new Date().toISOString().split("T")[0])
      setDescription("")
      setAccountId(accounts[0]?.id ?? "")
      setToAccountId(accounts.length > 1 ? (accounts.find((a) => a.id !== accounts[0].id)?.id ?? "") : "")
      setError("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create transaction")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const householdId = await fetchHouseholdId()
      const created = await createCategory({
        household_id: householdId,
        name: newCategoryName.trim(),
        is_income: type === "income",
      })
      onCategoryCreated(created)
      setCategoryId(created.id)
      setNewCategoryName("")
      setAddingCategory(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create category")
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
            <Label>Title{type === "transfer" && " (optional)"}</Label>
            <Input
              placeholder={type === "transfer" ? "e.g. Move to savings" : "Transaction title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {type !== "transfer" && (
            <div className="space-y-2">
              <Label>Merchant</Label>
              <Input placeholder="Merchant or payee name" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            </div>
          )}

          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Account</Label>
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
              <div className="space-y-2">
                <Label>To Account</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter((a) => a.id !== accountId).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                {addingCategory ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                    />
                    <Button type="button" size="sm" onClick={handleCreateCategory}>Add</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setAddingCategory(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Select
                    value={categoryId}
                    onValueChange={(v) => { if (v === "__add_new__") setAddingCategory(true); else setCategoryId(v) }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="text-primary">+ Add new category…</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
          )}

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
  const { format } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 25
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addDefaultType, setAddDefaultType] = useState<"income" | "expense" | "transfer" | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      const type = searchParams.get("type")
      setAddDefaultType(type === "income" || type === "expense" || type === "transfer" ? type : undefined)
      setIsAddOpen(true)
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

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

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const pagedTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + Math.abs(t.amount), 0)

  const openDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailOpen(true)
  }

  const handleSaved = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => t.id === updated.id ? updated : t))
  }

  const handleDeleted = (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)))
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
                  {format(totalIncome, { signDisplay: "always" })}
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
                  {format(-totalExpenses, { signDisplay: "always" })}
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
                  {format(totalIncome - totalExpenses)}
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
              <CardDescription>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
                {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="w-[220px] pl-9"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
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
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
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
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
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
                {pagedTransactions.map((transaction) => (
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
                        {format(transaction.amount, { signDisplay: "exceptZero" })}
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
                              const msg = transaction.transferGroupId
                                ? "Delete this transfer? Both sides (the debit and the credit) will be removed."
                                : "Delete this transaction?"
                              if (!confirm(msg)) return
                              try {
                                const result = await deleteTransaction(transaction.id)
                                handleDeleted(result.deleted_ids)
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
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
        onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
        defaultType={addDefaultType}
      />
    </div>
  )
}
