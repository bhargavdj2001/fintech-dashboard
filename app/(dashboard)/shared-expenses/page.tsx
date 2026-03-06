"use client"

import { useState } from "react"
import {
  Plus,
  Users,
  ArrowRight,
  Check,
  Clock,
  MoreHorizontal,
  UserPlus,
  Receipt,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

const groups = [
  {
    id: "1",
    name: "Household",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Sarah", avatar: "S", color: "bg-chart-2" },
    ],
    balance: 245.5,
    type: "household",
  },
  {
    id: "2",
    name: "Trip to Paris",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Mike", avatar: "M", color: "bg-chart-3" },
      { name: "Lisa", avatar: "L", color: "bg-chart-4" },
    ],
    balance: -180.25,
    type: "trip",
  },
  {
    id: "3",
    name: "Office Lunch",
    members: [
      { name: "John", avatar: "JD", color: "bg-primary" },
      { name: "Alex", avatar: "A", color: "bg-chart-5" },
      { name: "Emma", avatar: "E", color: "bg-chart-1" },
      { name: "Tom", avatar: "T", color: "bg-chart-2" },
    ],
    balance: 52.0,
    type: "project",
  },
]

const expenses = [
  {
    id: "1",
    title: "Groceries",
    amount: 127.45,
    paidBy: "John",
    paidByAvatar: "JD",
    group: "Household",
    date: "Mar 5, 2024",
    splitWith: ["Sarah"],
    status: "pending",
  },
  {
    id: "2",
    title: "Restaurant Dinner",
    amount: 245.0,
    paidBy: "Mike",
    paidByAvatar: "M",
    group: "Trip to Paris",
    date: "Mar 4, 2024",
    splitWith: ["John", "Lisa"],
    status: "settled",
  },
  {
    id: "3",
    title: "Electricity Bill",
    amount: 89.0,
    paidBy: "Sarah",
    paidByAvatar: "S",
    group: "Household",
    date: "Mar 3, 2024",
    splitWith: ["John"],
    status: "pending",
  },
  {
    id: "4",
    title: "Lunch Order",
    amount: 78.5,
    paidBy: "John",
    paidByAvatar: "JD",
    group: "Office Lunch",
    date: "Mar 2, 2024",
    splitWith: ["Alex", "Emma", "Tom"],
    status: "settled",
  },
  {
    id: "5",
    title: "Museum Tickets",
    amount: 120.0,
    paidBy: "Lisa",
    paidByAvatar: "L",
    group: "Trip to Paris",
    date: "Mar 1, 2024",
    splitWith: ["John", "Mike"],
    status: "pending",
  },
]

const balances = [
  {
    id: "1",
    person: "Sarah",
    avatar: "S",
    owes: false,
    amount: 108.23,
    color: "bg-chart-2",
  },
  {
    id: "2",
    person: "Mike",
    avatar: "M",
    owes: true,
    amount: 81.67,
    color: "bg-chart-3",
  },
  {
    id: "3",
    person: "Lisa",
    avatar: "L",
    owes: true,
    amount: 40.0,
    color: "bg-chart-4",
  },
  {
    id: "4",
    person: "Alex",
    avatar: "A",
    owes: false,
    amount: 19.63,
    color: "bg-chart-5",
  },
]

export default function SharedExpensesPage() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)

  const totalOwed = balances.filter((b) => !b.owes).reduce((acc, b) => acc + b.amount, 0)
  const totalOwing = balances.filter((b) => b.owes).reduce((acc, b) => acc + b.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Split bills and track shared costs with friends and family
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>Add a group to share expenses with</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input id="groupName" placeholder="e.g., Roommates, Trip" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupType">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="trip">Trip</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddGroupOpen(false)}>Create Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shared Expense</DialogTitle>
                <DialogDescription>Add an expense to split with others</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseTitle">Description</Label>
                  <Input id="expenseTitle" placeholder="What was the expense for?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount</Label>
                  <Input id="expenseAmount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseGroup">Group</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Split Method</Label>
                  <Select defaultValue="equal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Split Equally</SelectItem>
                      <SelectItem value="percentage">By Percentage</SelectItem>
                      <SelectItem value="custom">Custom Amounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddExpenseOpen(false)}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Are Owed</p>
                <p className="text-2xl font-bold text-success">+${totalOwed.toFixed(2)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You Owe</p>
                <p className="text-2xl font-bold text-destructive">-${totalOwing.toFixed(2)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalOwed - totalOwing).toFixed(2)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Groups</h2>
          {groups.map((group) => (
            <Card key={group.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{group.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 3).map((member, i) => (
                            <Avatar key={i} className="h-5 w-5 border-2 border-background">
                              <AvatarFallback className={`${member.color} text-[10px] text-white`}>
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          {group.members.length} members
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        group.balance >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {group.balance >= 0 ? "+" : ""}${Math.abs(group.balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="expenses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Shared Expenses</CardTitle>
                  <CardDescription>All your shared expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {expense.paidByAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{expense.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Paid by {expense.paidBy}</span>
                            <span>•</span>
                            <span>{expense.group}</span>
                            <span>•</span>
                            <span>{expense.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            ${expense.amount.toFixed(2)}
                          </p>
                          <Badge
                            variant="secondary"
                            className={
                              expense.status === "settled"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }
                          >
                            {expense.status === "settled" ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {expense.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Settled</DropdownMenuItem>
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

            <TabsContent value="balances" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
                  <CardDescription>Outstanding balances with others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {balances.map((balance) => (
                    <div
                      key={balance.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${balance.color} text-white`}>
                            {balance.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{balance.person}</p>
                          <p className="text-xs text-muted-foreground">
                            {balance.owes ? "owes you" : "you owe"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-semibold tabular-nums ${
                            balance.owes ? "text-destructive" : "text-success"
                          }`}
                        >
                          {balance.owes ? "-" : "+"}${balance.amount.toFixed(2)}
                        </span>
                        <Button variant="outline" size="sm">
                          {balance.owes ? "Request" : "Settle"}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
