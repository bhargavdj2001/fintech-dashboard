"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { fetchMe, logout, fetchAlerts, fetchBalancesByPartner, type User, type Alert } from "@/lib/api"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Users,
  TrendingUp,
  Lightbulb,
  Settings,
  CreditCard,
  Wallet,
  ChevronDown,
  LogOut,
  Building2,
  Target,
  FileText,
  Repeat,
  Banknote,
  Sun,
  Moon,
  Bell,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: PieChart,
  },
  {
    title: "Shared Expenses",
    url: "/shared-expenses",
    icon: Users,
  },
  {
    title: "Investments",
    url: "/investments",
    icon: TrendingUp,
  },
  {
    title: "Insights",
    url: "/insights",
    icon: Lightbulb,
  },
]

const accountItems = [
  {
    title: "All Accounts",
    url: "/accounts",
    icon: Building2,
  },
  {
    title: "Bank Accounts",
    url: "/accounts/bank",
    icon: Wallet,
  },
  {
    title: "Credit Cards",
    url: "/accounts/cards",
    icon: CreditCard,
  },
  {
    title: "Cash",
    url: "/accounts/cash",
    icon: Banknote,
  },
]

const planningItems = [
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Recurring",
    url: "/recurring",
    icon: Repeat,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
]

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [sharedBadge, setSharedBadge] = useState<number | null>(null)

  useEffect(() => {
    fetchMe().then(setUser).catch(() => {})
    const loadAlerts = () => fetchAlerts().then(setAlerts).catch(() => {})
    loadAlerts()
    fetchBalancesByPartner()
      .then((balances) => {
        const unsettled = balances.filter((b) => Math.abs(b.net_balance) > 0.005).length
        setSharedBadge(unsettled > 0 ? unsettled : null)
      })
      .catch(() => {})
    const interval = setInterval(loadAlerts, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() ?? "?"

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">FinancialOS</span>
              <span className="text-xs text-muted-foreground">Personal Finance</span>
            </div>
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {alerts.length > 9 ? "9+" : alerts.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">{alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</p>
              </div>
              {alerts.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">All clear — no alerts.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y">
                  {alerts.map((a) => (
                    <Link key={a.id} href={a.href} className="block px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          a.severity === "error" ? "bg-destructive" :
                          a.severity === "warning" ? "bg-warning" :
                          a.severity === "success" ? "bg-success" : "bg-primary"
                        }`} />
                        <div>
                          <p className="text-sm font-medium leading-tight">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-10 px-3 transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Shared Expenses" && sharedBadge !== null ? (
                        <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs font-medium">
                          {sharedBadge}
                        </Badge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Accounts
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                    className="h-10 px-3 transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Planning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {planningItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-10 px-3 transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-10 px-3 transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-3">
        <SidebarSeparator className="mb-3" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-sidebar-foreground">{user?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {resolvedTheme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
