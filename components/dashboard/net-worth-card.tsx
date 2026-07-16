"use client"

import { useEffect, useState } from "react"
import { fetchAccounts } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NetWorthCard() {
  const { format } = useCurrency()
  const [assets, setAssets] = useState(0)
  const [liabilities, setLiabilities] = useState(0)

  useEffect(() => {
    fetchAccounts()
      .then((accounts) => {
        const totalAssets = accounts
          .filter((a) => a.type !== "credit")
          .reduce((acc, a) => acc + a.current_balance, 0)
        const totalLiabilities = accounts
          .filter((a) => a.type === "credit")
          .reduce((acc, a) => acc + Math.abs(a.current_balance), 0)
        setAssets(totalAssets)
        setLiabilities(totalLiabilities)
      })
      .catch(console.error)
  }, [])

  const netWorth = assets - liabilities

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
            {format(netWorth)}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-foreground">{format(assets)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-foreground">{format(liabilities)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
