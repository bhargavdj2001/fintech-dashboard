"use client"

import { Calendar, CreditCard, Wifi, Tv, Music } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const bills = [
  {
    name: "Netflix",
    amount: 15.99,
    dueDate: "Mar 8",
    icon: Tv,
    recurring: true,
  },
  {
    name: "Internet",
    amount: 79.99,
    dueDate: "Mar 12",
    icon: Wifi,
    recurring: true,
  },
  {
    name: "Spotify",
    amount: 9.99,
    dueDate: "Mar 15",
    icon: Music,
    recurring: true,
  },
  {
    name: "Credit Card",
    amount: 2340.0,
    dueDate: "Mar 20",
    icon: CreditCard,
    recurring: false,
  },
]

export function UpcomingBills() {
  const totalDue = bills.reduce((acc, bill) => acc + bill.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Upcoming Bills</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold text-foreground">${totalDue.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.name}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                <bill.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{bill.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {bill.dueDate}
                </div>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              ${bill.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
