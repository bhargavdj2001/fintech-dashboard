"use client"

import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const forecast = {
  expectedIncome: 9500,
  expectedExpenses: 6800,
  projectedSavings: 2700,
  upcomingBills: 1250,
  scheduledTransfers: 500,
  daysRemaining: 18,
}

export function MonthlyForecast() {
  const projectedBalance = forecast.expectedIncome - forecast.expectedExpenses
  const balanceStatus = projectedBalance > 0 ? "positive" : projectedBalance < 0 ? "negative" : "neutral"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Monthly Forecast</CardTitle>
          <CardDescription>{forecast.daysRemaining} days remaining</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expected Income</span>
            <span className="text-sm font-medium text-success">
              +${forecast.expectedIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expected Expenses</span>
            <span className="text-sm font-medium text-destructive">
              -${forecast.expectedExpenses.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Projected Savings</span>
              <div className="flex items-center gap-2">
                {balanceStatus === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : balanceStatus === "negative" ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-lg font-bold ${
                    balanceStatus === "positive"
                      ? "text-success"
                      : balanceStatus === "negative"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  ${Math.abs(projectedBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Upcoming Bills</span>
            <span className="font-medium text-foreground">${forecast.upcomingBills.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Scheduled Transfers</span>
            <span className="font-medium text-foreground">${forecast.scheduledTransfers.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
