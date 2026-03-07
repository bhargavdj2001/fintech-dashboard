"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CreditCard,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
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

const creditCards = [
  {
    id: "4",
    name: "Sapphire Reserve",
    institution: "Chase",
    balance: 2340.5,
    limit: 25000,
    lastSync: "10 min ago",
    accountNumber: "****7789",
    dueDate: "Mar 15",
    minPayment: 75,
    apr: 22.99,
    rewards: 45820,
    rewardType: "Points",
    spendingHistory: [
      { month: "Oct", spent: 1800 },
      { month: "Nov", spent: 2200 },
      { month: "Dec", spent: 3100 },
      { month: "Jan", spent: 1900 },
      { month: "Feb", spent: 2400 },
      { month: "Mar", spent: 2340 },
    ],
    recentTransactions: [
      { id: "1", title: "Whole Foods", amount: 127.45, date: "Mar 5", category: "Groceries" },
      { id: "2", title: "Netflix", amount: 15.99, date: "Mar 6", category: "Entertainment" },
      { id: "3", title: "Restaurant", amount: 64.5, date: "Mar 5", category: "Dining" },
    ],
  },
  {
    id: "5",
    name: "Cash Rewards",
    institution: "Capital One",
    balance: 890.25,
    limit: 15000,
    lastSync: "15 min ago",
    accountNumber: "****2234",
    dueDate: "Mar 22",
    minPayment: 25,
    apr: 19.99,
    rewards: 1245.8,
    rewardType: "Cashback",
    spendingHistory: [
      { month: "Oct", spent: 750 },
      { month: "Nov", spent: 920 },
      { month: "Dec", spent: 1100 },
      { month: "Jan", spent: 680 },
      { month: "Feb", spent: 840 },
      { month: "Mar", spent: 890 },
    ],
    recentTransactions: [
      { id: "4", title: "Shell Gas", amount: 45, date: "Mar 6", category: "Transportation" },
      { id: "5", title: "Verizon", amount: 65, date: "Mar 8", category: "Utilities" },
    ],
  },
]

const chartConfig = {
  spent: {
    label: "Spending",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export default function CreditCardsPage() {
  const [selectedCard, setSelectedCard] = useState(creditCards[0])

  const totalBalance = creditCards.reduce((acc, c) => acc + c.balance, 0)
  const totalLimit = creditCards.reduce((acc, c) => acc + c.limit, 0)

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
              {creditCards.length} cards · ${totalBalance.toLocaleString()} total balance
            </p>
          </div>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-destructive">
              ${totalBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              of ${totalLimit.toLocaleString()} total limit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Utilization</p>
            <p className="text-2xl font-bold text-foreground">
              {((totalBalance / totalLimit) * 100).toFixed(1)}%
            </p>
            <Progress value={(totalBalance / totalLimit) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Next Payment Due</p>
            <p className="text-2xl font-bold text-foreground">Mar 15</p>
            <p className="text-xs text-warning mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              In 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Your Cards
          </h2>
          {creditCards.map((card) => {
            const utilization = (card.balance / card.limit) * 100
            return (
              <Card
                key={card.id}
                className={`cursor-pointer transition-all hover:bg-muted/30 ${
                  selectedCard.id === card.id ? "ring-2 ring-primary" : ""
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
                        <p className="text-xs text-muted-foreground">
                          {card.institution} · {card.accountNumber}
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
                        <DropdownMenuItem>Make Payment</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove Card</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4">
                    <p className="text-2xl font-bold text-destructive">
                      ${card.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      of ${card.limit.toLocaleString()} limit
                    </p>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={utilization > 30 ? "text-warning font-medium" : "text-success font-medium"}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={utilization} className="h-1.5" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Due: {card.dueDate}</span>
                    <span className="text-muted-foreground">Min: ${card.minPayment}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">APR</p>
                <p className="text-xl font-bold text-foreground">{selectedCard.apr}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-xl font-bold text-foreground">{selectedCard.dueDate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{selectedCard.rewardType} Balance</p>
                <p className="text-xl font-bold text-foreground">
                  {selectedCard.rewardType === "Points"
                    ? `${selectedCard.rewards.toLocaleString()} pts`
                    : `$${selectedCard.rewards.toFixed(2)}`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Monthly Spending</CardTitle>
              <CardDescription>{selectedCard.name} · last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart
                  data={selectedCard.spendingHistory}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
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
                <Button size="sm">
                  Make Payment
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedCard.recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{txn.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.category} · {txn.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    ${txn.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/transactions">
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
