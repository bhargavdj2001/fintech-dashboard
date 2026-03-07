"use client"

import { useState } from "react"
import {
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Globe,
  Download,
  Trash2,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Mail,
  Smartphone,
  Lock,
  Key,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
]

const connectedApps = [
  { name: "Google Sheets", status: "connected", icon: "📊" },
  { name: "Notion", status: "disconnected", icon: "📝" },
  { name: "Plaid", status: "connected", icon: "🏦" },
]

export default function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("dark")
  const [currency, setCurrency] = useState("USD")
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    transactionAlerts: true,
    weeklyReport: true,
    monthlyReport: false,
    goalMilestones: true,
    unusualActivity: true,
    emailNotifications: true,
    pushNotifications: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/avatars/user.jpg" alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Change Photo</Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Financial Preferences</CardTitle>
              <CardDescription>Set your default currency and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">{c.symbol}</span>
                            {c.name} ({c.code})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year Start</Label>
                  <Select defaultValue="jan">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan">January</SelectItem>
                      <SelectItem value="apr">April</SelectItem>
                      <SelectItem value="jul">July</SelectItem>
                      <SelectItem value="oct">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number Format</Label>
                  <Select defaultValue="us">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">1,234.56 (US)</SelectItem>
                      <SelectItem value="eu">1.234,56 (EU)</SelectItem>
                      <SelectItem value="in">1,23,456.78 (IN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Connected Apps</CardTitle>
              <CardDescription>Manage third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedApps.map((app) => (
                <div
                  key={app.name}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{app.name}</p>
                      <Badge
                        variant="secondary"
                        className={
                          app.status === "connected"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {app.status === "connected" ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : null}
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant={app.status === "connected" ? "outline" : "default"} size="sm">
                    {app.status === "connected" ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notification Channels</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts and reports via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => toggleNotification("emailNotifications")}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <Smartphone className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time alerts on your device
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={() => toggleNotification("pushNotifications")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Alert Preferences</CardTitle>
              <CardDescription>Control which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: "budgetAlerts" as const,
                  label: "Budget Alerts",
                  description: "Notify when approaching or exceeding budget limits",
                },
                {
                  key: "transactionAlerts" as const,
                  label: "Transaction Alerts",
                  description: "Notify for each new transaction",
                },
                {
                  key: "unusualActivity" as const,
                  label: "Unusual Activity",
                  description: "Alert on spending anomalies or unusual patterns",
                },
                {
                  key: "goalMilestones" as const,
                  label: "Goal Milestones",
                  description: "Celebrate when you hit savings goal milestones",
                },
                {
                  key: "weeklyReport" as const,
                  label: "Weekly Summary",
                  description: "Weekly digest of your financial activity",
                },
                {
                  key: "monthlyReport" as const,
                  label: "Monthly Report",
                  description: "Comprehensive monthly financial report",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={() => toggleNotification(item.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Theme</CardTitle>
              <CardDescription>Choose the application color theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                  { value: "system" as const, label: "System", icon: Monitor },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setAppearance(theme.value)}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                      appearance === theme.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <theme.icon
                      className={`h-6 w-6 ${
                        appearance === theme.value ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        appearance === theme.value ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {theme.label}
                    </span>
                    {appearance === theme.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Display Preferences</CardTitle>
              <CardDescription>Customize how financial data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Compact Mode",
                  description: "Show more data with reduced spacing",
                },
                {
                  label: "Show Account Numbers",
                  description: "Display masked account numbers in account list",
                },
                {
                  label: "Colorize Transactions",
                  description: "Use colors to distinguish income and expenses",
                },
                {
                  label: "Show Transaction IDs",
                  description: "Display transaction IDs in lists and tables",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-end">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Smartphone className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app to generate codes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    <Check className="mr-1 h-3 w-3" />
                    Enabled
                  </Badge>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a verification code by email
                    </p>
                  </div>
                </div>
                <Button size="sm">Enable</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Active Sessions</CardTitle>
              <CardDescription>Manage devices with access to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  device: "MacBook Pro — Chrome",
                  location: "San Francisco, US",
                  time: "Current session",
                  current: true,
                },
                {
                  device: "iPhone 15 — Safari",
                  location: "San Francisco, US",
                  time: "2 hours ago",
                  current: false,
                },
                {
                  device: "iPad — Safari",
                  location: "New York, US",
                  time: "3 days ago",
                  current: false,
                },
              ].map((session) => (
                <div
                  key={session.device}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{session.device}</p>
                        {session.current && (
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.location} · {session.time}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Export Data</CardTitle>
              <CardDescription>Download your financial data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Transaction History",
                  description: "All transactions with categories and notes",
                  formats: ["CSV", "Excel", "PDF"],
                },
                {
                  label: "Budget Data",
                  description: "Budget categories, limits and spending history",
                  formats: ["CSV", "Excel"],
                },
                {
                  label: "Investment Portfolio",
                  description: "Holdings, transactions and performance data",
                  formats: ["CSV", "Excel", "PDF"],
                },
                {
                  label: "Net Worth History",
                  description: "Historical net worth and asset breakdown",
                  formats: ["CSV", "PDF"],
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {item.formats.map((format) => (
                        <Badge key={format} variant="secondary" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Data Retention</CardTitle>
              <CardDescription>Control how long your data is stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction History Retention</Label>
                <Select defaultValue="forever">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1y">1 Year</SelectItem>
                    <SelectItem value="3y">3 Years</SelectItem>
                    <SelectItem value="5y">5 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">Save Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Delete All Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove all transaction history
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
