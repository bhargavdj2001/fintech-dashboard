"use client"

import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NetWorthCard() {
  const netWorth = 248750
  const change = 12.5
  const isPositive = change >= 0

  return (
    <Card className="md:col-span-2 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Net Worth
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            ${netWorth.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}{change}%
          </div>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-foreground">$312,500</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-foreground">$63,750</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
