import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { CommandPalette } from "@/components/command-palette"
import { CommandShortcut } from "@/components/command-shortcut"
import { AuthGuard } from "@/components/auth-guard"
import { CurrencyProvider } from "@/lib/currency"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <CurrencyProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <DashboardBreadcrumb />
              <div className="ml-auto flex items-center gap-2">
                <CommandShortcut />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-6">{children}</div>
            </main>
          </SidebarInset>
          <CommandPalette />
        </SidebarProvider>
      </CurrencyProvider>
    </AuthGuard>
  )
}
