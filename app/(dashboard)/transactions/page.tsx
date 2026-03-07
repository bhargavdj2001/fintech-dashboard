"use client"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type TransactionType = "income" | "expense" | "transfer"
type TransactionStatus = "posted" | "pending"

interface Transaction {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  amount: number
  type: TransactionType
  date: string
  merchant: string
  account: string
  status: TransactionStatus
  paymentMethod: string
  tags?: string[]
  reconciled?: boolean
  notes?: string
}

const transactions: Transaction[] = [
  {
    id: "TXN001",
    title: "Salary Deposit",
    description: "Monthly salary",
    category: "Income",
    subcategory: "Salary",
    amount: 5200,
    type: "income",
    date: "2024-03-01",
    merchant: "Acme Corp",
    account: "Checking",
    status: "posted",
    paymentMethod: "Direct Deposit",
    tags: ["salary", "recurring"],
    reconciled: true,
  },
  {
    id: "TXN002",
    title: "Grocery Shopping",
    description: "Weekly groceries",
    category: "Food & Dining",
    subcategory: "Groceries",
    amount: -127.45,
    type: "expense",
    date: "2024-03-03",
    merchant: "Whole Foods",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
    tags: ["groceries", "food"],
    reconciled: true,
  },
  {
    id: "TXN003",
    title: "Electric Bill",
    description: "March electricity",
    category: "Utilities",
    subcategory: "Electricity",
    amount: -89.0,
    type: "expense",
    date: "2024-03-04",
    merchant: "City Power",
    account: "Checking",
    status: "posted",
    paymentMethod: "Auto Pay",
    tags: ["utilities", "recurring"],
    reconciled: true,
  },
  {
    id: "TXN004",
    title: "Freelance Payment",
    description: "Website design project",
    category: "Income",
    subcategory: "Freelance",
    amount: 850,
    type: "income",
    date: "2024-03-05",
    merchant: "Client XYZ",
    account: "Checking",
    status: "posted",
    paymentMethod: "Bank Transfer",
    tags: ["freelance", "business"],
    reconciled: false,
  },
  {
    id: "TXN005",
    title: "Restaurant",
    description: "Dinner with friends",
    category: "Food & Dining",
    subcategory: "Restaurants",
    amount: -64.5,
    type: "expense",
    date: "2024-03-05",
    merchant: "The Italian Place",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
    tags: ["dining", "social"],
    reconciled: true,
    notes: "Birthday dinner",
  },
  {
    id: "TXN006",
    title: "Netflix Subscription",
    description: "Monthly subscription",
    category: "Entertainment",
    subcategory: "Streaming",
    amount: -15.99,
    type: "expense",
    date: "2024-03-06",
    merchant: "Netflix",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
    tags: ["subscription", "entertainment", "recurring"],
    reconciled: true,
  },
  {
    id: "TXN007",
    title: "Gas Station",
    description: "Fuel refill",
    category: "Transportation",
    subcategory: "Fuel",
    amount: -45.0,
    type: "expense",
    date: "2024-03-06",
    merchant: "Shell",
    account: "Debit Card",
    status: "posted",
    paymentMethod: "Debit Card",
    tags: ["fuel", "transportation"],
    reconciled: true,
  },
  {
    id: "TXN008",
    title: "Investment Transfer",
    description: "Monthly investment",
    category: "Transfer",
    subcategory: "Investment",
    amount: -500,
    type: "transfer",
    date: "2024-03-07",
    merchant: "Vanguard",
    account: "Checking",
    status: "pending",
    paymentMethod: "Bank Transfer",
    tags: ["investment", "transfer"],
    reconciled: false,
  },
  {
    id: "TXN009",
    title: "Coffee Shop",
    description: "Morning coffee",
    category: "Food & Dining",
    subcategory: "Coffee",
    amount: -5.75,
    type: "expense",
    date: "2024-03-07",
    merchant: "Starbucks",
    account: "Debit Card",
    status: "posted",
    paymentMethod: "Debit Card",
    tags: ["coffee", "food"],
    reconciled: true,
  },
  {
    id: "TXN010",
    title: "Phone Bill",
    description: "Monthly plan",
    category: "Utilities",
    subcategory: "Phone",
    amount: -65.0,
    type: "expense",
    date: "2024-03-08",
    merchant: "Verizon",
    account: "Credit Card",
    status: "pending",
    paymentMethod: "Auto Pay",
    tags: ["phone", "utilities", "recurring"],
    reconciled: false,
  },
]

const categories = [
  "All Categories",
  "Income",
  "Food & Dining",
  "Utilities",
  "Entertainment",
  "Transportation",
  "Transfer",
  "Shopping",
  "Healthcare",
]

const subcategoryMap: Record<string, string[]> = {
  "Income": ["Salary", "Freelance", "Investment Income", "Other"],
  "Food & Dining": ["Groceries", "Restaurants", "Coffee", "Delivery", "Bars"],
  "Utilities": ["Electricity", "Gas", "Water", "Phone", "Internet"],
  "Entertainment": ["Streaming", "Movies", "Games", "Events"],
  "Transportation": ["Fuel", "Parking", "Public Transit", "Ride Share"],
  "Shopping": ["Clothing", "Electronics", "Home", "Other"],
  "Healthcare": ["Doctor", "Pharmacy", "Dental", "Vision"],
}

function TransactionDetailSheet({
  transaction,
  open,
  onClose,
}: {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}) {
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(transaction?.tags ?? [])

  if (!transaction) return null

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
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
              <SheetDescription className="text-left">{transaction.id}</SheetDescription>
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
              {Math.abs(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
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
              {transaction.reconciled && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Reconciled
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Transaction Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Date</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {new Date(transaction.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize text-foreground">{transaction.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Merchant</p>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{transaction.merchant}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="text-sm font-medium text-foreground">{transaction.account}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{transaction.category}</p>
              </div>
              {transaction.subcategory && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Subcategory</p>
                  <p className="text-sm font-medium text-foreground">{transaction.subcategory}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{transaction.paymentMethod}</p>
                </div>
              </div>
            </div>

            {transaction.description && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">{transaction.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 rounded-full hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <Textarea
              placeholder="Add a note..."
              defaultValue={transaction.notes}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <SplitSquareHorizontal className="mr-2 h-4 w-4" />
              Split Transaction
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Receipt className="mr-2 h-4 w-4" />
              Attach Receipt
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Reconciled
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1">Save Changes</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Delete
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
}: {
  open: boolean
  onClose: () => void
}) {
  const [selectedCategory, setSelectedCategory] = useState("")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new financial transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue="expense">
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
              <Input type="number" placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Transaction title" />
          </div>

          <div className="space-y-2">
            <Label>Merchant</Label>
            <Input placeholder="Merchant or payee name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(subcategoryMap).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select disabled={!selectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(subcategoryMap[selectedCategory] ?? []).map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input placeholder="Brief description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Add Transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.tags ?? []).some((t) => t.includes(searchQuery.toLowerCase()))
    const matchesCategory =
      categoryFilter === "All Categories" || transaction.category === categoryFilter
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)

  const openDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailOpen(true)
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  placeholder="Search transactions, tags..."
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
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
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground">{transaction.merchant}</p>
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex gap-1">
                              {transaction.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="h-4 px-1 text-[10px]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {transaction.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{transaction.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="secondary" className="font-normal">
                        {transaction.category}
                      </Badge>
                      {transaction.subcategory && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {transaction.subcategory}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.account}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                      {transaction.reconciled && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
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
                        <DropdownMenuItem onClick={() => openDetail(transaction)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Split Transaction</DropdownMenuItem>
                        <DropdownMenuItem>Mark Reconciled</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionDetailSheet
        transaction={selectedTransaction}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <AddTransactionDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  )
}
