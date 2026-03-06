"use client"

import { TrendingUp, TrendingDown, Plus, MoreHorizontal, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const portfolioData = [
  { date: "Jan", value: 145000 },
  { date: "Feb", value: 148500 },
  { date: "Mar", value: 142000 },
  { date: "Apr", value: 155000 },
  { date: "May", value: 152000 },
  { date: "Jun", value: 158000 },
  { date: "Jul", value: 165000 },
  { date: "Aug", value: 162000 },
  { date: "Sep", value: 168000 },
  { date: "Oct", value: 172000 },
  { date: "Nov", value: 178000 },
  { date: "Dec", value: 186750 },
]

const allocationData = [
  { name: "Stocks", value: 95000, color: "var(--chart-1)" },
  { name: "Mutual Funds", value: 45000, color: "var(--chart-2)" },
  { name: "ETFs", value: 25000, color: "var(--chart-3)" },
  { name: "Bonds", value: 12000, color: "var(--chart-4)" },
  { name: "Crypto", value: 6750, color: "var(--chart-5)" },
  { name: "Gold", value: 3000, color: "var(--muted)" },
]

const holdings = [
  {
    id: "1",
    name: "Apple Inc.",
    symbol: "AAPL",
    type: "Stock",
    units: 50,
    avgPrice: 145.0,
    currentPrice: 182.52,
    value: 9126,
    gain: 1876,
    gainPercent: 25.88,
  },
  {
    id: "2",
    name: "Vanguard S&P 500",
    symbol: "VOO",
    type: "ETF",
    units: 25,
    avgPrice: 380.0,
    currentPrice: 425.5,
    value: 10637.5,
    gain: 1137.5,
    gainPercent: 11.97,
  },
  {
    id: "3",
    name: "Microsoft Corp.",
    symbol: "MSFT",
    type: "Stock",
    units: 30,
    avgPrice: 280.0,
    currentPrice: 378.91,
    value: 11367.3,
    gain: 2967.3,
    gainPercent: 35.33,
  },
  {
    id: "4",
    name: "Tesla Inc.",
    symbol: "TSLA",
    type: "Stock",
    units: 20,
    avgPrice: 250.0,
    currentPrice: 215.0,
    value: 4300,
    gain: -700,
    gainPercent: -14.0,
  },
  {
    id: "5",
    name: "HDFC Balanced Advantage",
    symbol: "HDFC-BAF",
    type: "Mutual Fund",
    units: 500,
    avgPrice: 45.0,
    currentPrice: 52.75,
    value: 26375,
    gain: 3875,
    gainPercent: 17.22,
  },
  {
    id: "6",
    name: "Bitcoin",
    symbol: "BTC",
    type: "Crypto",
    units: 0.15,
    avgPrice: 35000,
    currentPrice: 45000,
    value: 6750,
    gain: 1500,
    gainPercent: 28.57,
  },
  {
    id: "7",
    name: "US Treasury Bond",
    symbol: "GOVT",
    type: "Bond",
    units: 100,
    avgPrice: 110.0,
    currentPrice: 108.5,
    value: 10850,
    gain: -150,
    gainPercent: -1.36,
  },
  {
    id: "8",
    name: "Amazon.com Inc.",
    symbol: "AMZN",
    type: "Stock",
    units: 40,
    avgPrice: 130.0,
    currentPrice: 175.35,
    value: 7014,
    gain: 1814,
    gainPercent: 34.88,
  },
]

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function InvestmentsPage() {
  const totalValue = holdings.reduce((acc, h) => acc + h.value, 0)
  const totalGain = holdings.reduce((acc, h) => acc + h.gain, 0)
  const totalGainPercent = (totalGain / (totalValue - totalGain)) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Investments</h1>
          <p className="text-sm text-muted-foreground">
            Track your portfolio performance and holdings
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-3xl font-bold text-foreground">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                  totalGain >= 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {totalGain >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {totalGain >= 0 ? "+" : ""}
                {totalGainPercent.toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
              <p
                className={`text-2xl font-bold ${
                  totalGain >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {totalGain >= 0 ? "+" : ""}${totalGain.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Holdings</p>
              <p className="text-2xl font-bold text-foreground">{holdings.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Portfolio Performance</CardTitle>
                <CardDescription>12-month value history</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="font-normal">
                  1Y
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={portfolioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
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
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fill="url(#fillValue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Asset Allocation</CardTitle>
            <CardDescription>Distribution by asset type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    ${(totalValue / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {allocationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium tabular-nums text-foreground">
                    ${item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Holdings</CardTitle>
              <CardDescription>All your investment holdings</CardDescription>
            </div>
            <Tabs defaultValue="all" className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
                <TabsTrigger value="funds">Funds</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Avg. Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{holding.name}</p>
                      <p className="text-xs text-muted-foreground">{holding.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {holding.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {holding.units}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    ${holding.avgPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground font-medium">
                    ${holding.currentPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-foreground">
                    ${holding.value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        holding.gain >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {holding.gain >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="tabular-nums font-medium">
                        {holding.gain >= 0 ? "+" : ""}
                        {holding.gainPercent.toFixed(2)}%
                      </span>
                    </div>
                    <p
                      className={`text-xs tabular-nums ${
                        holding.gain >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {holding.gain >= 0 ? "+" : ""}${Math.abs(holding.gain).toLocaleString()}
                    </p>
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
                        <DropdownMenuItem>Add Transaction</DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          View Chart
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
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
