"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Users,
  TrendingUp,
  Lightbulb,
  Building2,
  Target,
  Repeat,
  FileText,
  Plus,
  Calculator,
  Settings,
  CreditCard,
  Wallet,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, shortcut: "D" },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight, shortcut: "T" },
  { name: "Budgets", href: "/budgets", icon: PieChart, shortcut: "B" },
  { name: "Shared Expenses", href: "/shared-expenses", icon: Users, shortcut: "S" },
  { name: "Investments", href: "/investments", icon: TrendingUp, shortcut: "I" },
  { name: "Insights", href: "/insights", icon: Lightbulb, shortcut: "N" },
  { name: "Accounts", href: "/accounts", icon: Building2, shortcut: "A" },
  { name: "Goals", href: "/goals", icon: Target, shortcut: "G" },
  { name: "Recurring", href: "/recurring", icon: Repeat, shortcut: "R" },
  { name: "Reports", href: "/reports", icon: FileText, shortcut: "P" },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "," },
]

const quickActions = [
  { name: "Add Transaction", action: "add-transaction", icon: Plus },
  { name: "Transfer Money", action: "transfer", icon: ArrowLeftRight },
  { name: "Create Budget", action: "create-budget", icon: PieChart },
  { name: "Add Goal", action: "add-goal", icon: Target },
  { name: "Quick Calculate", action: "calculate", icon: Calculator },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              <CommandShortcut>{item.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.action}
              onSelect={() => {
                runCommand(() => {
                  // Handle quick actions
                  switch (action.action) {
                    case "add-transaction":
                      router.push("/transactions?action=add")
                      break
                    case "transfer":
                      // No standalone "transfer" UI exists — reuse the
                      // transaction form with its Transfer type preselected.
                      router.push("/transactions?action=add&type=transfer")
                      break
                    case "create-budget":
                      router.push("/budgets?action=add")
                      break
                    case "add-goal":
                      router.push("/goals?action=add")
                      break
                    default:
                      break
                  }
                })
              }}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Accounts">
          <CommandItem onSelect={() => runCommand(() => router.push("/accounts/bank"))}>
            <Wallet className="mr-2 h-4 w-4" />
            <span>Bank Accounts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/accounts/cards"))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Credit Cards</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
