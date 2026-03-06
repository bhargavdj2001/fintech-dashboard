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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

const transactions = [
  {
    id: "TXN001",
    title: "Salary Deposit",
    description: "Monthly salary",
    category: "Income",
    amount: 5200,
    type: "income",
    date: "2024-03-01",
    merchant: "Acme Corp",
    account: "Checking",
    status: "posted",
    paymentMethod: "Direct Deposit",
  },
  {
    id: "TXN002",
    title: "Grocery Shopping",
    description: "Weekly groceries",
    category: "Food & Dining",
    amount: -127.45,
    type: "expense",
    date: "2024-03-03",
    merchant: "Whole Foods",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN003",
    title: "Electric Bill",
    description: "March electricity",
    category: "Utilities",
    amount: -89.0,
    type: "expense",
    date: "2024-03-04",
    merchant: "City Power",
    account: "Checking",
    status: "posted",
    paymentMethod: "Auto Pay",
  },
  {
    id: "TXN004",
    title: "Freelance Payment",
    description: "Website design project",
    category: "Income",
    amount: 850,
    type: "income",
    date: "2024-03-05",
    merchant: "Client XYZ",
    account: "Checking",
    status: "posted",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "TXN005",
    title: "Restaurant",
    description: "Dinner with friends",
    category: "Food & Dining",
    amount: -64.5,
    type: "expense",
    date: "2024-03-05",
    merchant: "The Italian Place",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN006",
    title: "Netflix Subscription",
    description: "Monthly subscription",
    category: "Entertainment",
    amount: -15.99,
    type: "expense",
    date: "2024-03-06",
    merchant: "Netflix",
    account: "Credit Card",
    status: "posted",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN007",
    title: "Gas Station",
    description: "Fuel refill",
    category: "Transportation",
    amount: -45.0,
    type: "expense",
    date: "2024-03-06",
    merchant: "Shell",
    account: "Debit Card",
    status: "posted",
    paymentMethod: "Debit Card",
  },
  {
    id: "TXN008",
    title: "Investment Transfer",
    description: "Monthly investment",
    category: "Transfer",
    amount: -500,
    type: "transfer",
    date: "2024-03-07",
    merchant: "Vanguard",
    account: "Checking",
    status: "pending",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "TXN009",
    title: "Coffee Shop",
    description: "Morning coffee",
    category: "Food & Dining",
    amount: -5.75,
    type: "expense",
    date: "2024-03-07",
    merchant: "Starbucks",
    account: "Debit Card",
    status: "posted",
    paymentMethod: "Debit Card",
  },
  {
    id: "TXN010",
    title: "Phone Bill",
    description: "Monthly plan",
    category: "Utilities",
    amount: -65.0,
    type: "expense",
    date: "2024-03-08",
    merchant: "Verizon",
    account: "Credit Card",
    status: "pending",
    paymentMethod: "Auto Pay",
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
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === "All Categories" || transaction.category === categoryFilter
    const matchesType =
      typeFilter === "all" || transaction.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)

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
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
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
                  className="w-[200px] pl-9"
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
                <TableRow key={transaction.id}>
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
                    <Badge
                      variant={transaction.status === "posted" ? "default" : "secondary"}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Add Tag</DropdownMenuItem>
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
    </div>
  )
}
