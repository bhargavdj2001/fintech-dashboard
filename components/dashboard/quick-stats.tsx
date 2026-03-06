"use client"

import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    label: "Total Balance",
    value: "$57,650",
    change: "+2.5%",
    trend: "up",
    icon: Wallet,
  },
  {
    label: "Monthly Income",
    value: "$9,500",
    change: "+12%",
    trend: "up",
    icon: ArrowDownLeft,
  },
  {
    label: "Monthly Expenses",
    value: "$6,800",
    change: "-5%",
    trend: "down",
    icon: ArrowUpRight,
  },
  {
    label: "Credit Used",
    value: "23%",
    change: "-8%",
    trend: "down",
    icon: CreditCard,
  },
]

export function QuickStats() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  stat.trend === "up" && stat.label !== "Monthly Expenses"
                    ? "bg-success/10 text-success"
                    : stat.trend === "down" && stat.label === "Monthly Expenses"
                    ? "bg-success/10 text-success"
                    : stat.trend === "down" && stat.label === "Credit Used"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {stat.change}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
