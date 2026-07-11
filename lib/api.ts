/**
 * FinancialOS API client.
 * All functions call the FastAPI backend at NEXT_PUBLIC_API_URL.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Exposed so the frontend can build full URLs for server-relative paths
// (e.g. receipt_url) returned by the API.
export const API_BASE_URL = BASE_URL;

const TOKEN_KEY = "financialos_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const AUTH_PATHS_NO_REDIRECT = ["/auth/login", "/auth/register"];

export class ServiceUnavailableError extends Error {
  constructor(message = "Backend temporarily unavailable") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers, ...init });
  } catch {
    throw new ServiceUnavailableError("Backend unreachable — API server may be down");
  }

  if (res.status === 401 && !AUTH_PATHS_NO_REDIRECT.includes(path)) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("API 401: Not authenticated");
  }
  if (res.status === 503) {
    throw new ServiceUnavailableError("Backend temporarily unavailable — database unreachable");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Household {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  external_id: string | null;
  last_synced_at: string | null;
}

// Lighter shape used when an account is nested inside a transaction or
// investment — the backend doesn't compute current_balance per nested row.
export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  is_income: boolean;
  parent_id: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  default_share: number | null;
  is_owner: boolean;
}

export interface Split {
  id: string;
  profile_id: string;
  share_amount: number;
  share_percent: number | null;
  paid_amount: number;
  profile: Profile | null;
}

export interface Transaction {
  id: string;
  household_id: string;
  account_id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  type: "income" | "expense" | "transfer";
  occurred_at: string;
  merchant: string | null;
  status: string | null;
  is_recurring_instance: boolean;
  category_id: string | null;
  created_by_profile_id: string | null;
  transfer_group_id: string | null;
  receipt_url: string | null;
  account: AccountSummary | null;
  category: Category | null;
  splits: Split[];
  created_at: string | null;
}

export interface PaginatedTransactions {
  total: number;
  limit: number;
  offset: number;
  items: Transaction[];
}

export interface Budget {
  id: string;
  household_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  period_type: string;
  carry_over: boolean;
  start_date: string | null;
  created_at: string | null;
  category: Category | null;
  spent: number;
  rollover_amount: number;
  effective_amount: number;
}

export interface InvestmentTransaction {
  id: string;
  txn_type: string;
  units: number | null;
  price_per_unit: number | null;
  fees: number | null;
  currency: string | null;
  occurred_at: string;
}

export interface Investment {
  id: string;
  household_id: string | null;
  name: string;
  instrument: string | null;
  account_id: string | null;
  created_at: string | null;
  account: AccountSummary | null;
  investment_transactions: InvestmentTransaction[];
}

export interface RecurringRule {
  id: string;
  household_id: string | null;
  freq: string | null;
  cron_expr: string | null;
  next_run_at: string | null;
  is_active: boolean;
  template_txn: Record<string, unknown> | null;
  created_at: string | null;
}

export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  net_cashflow: number;
  recent_transactions: Transaction[];
  category_breakdown: Record<string, number>;
}

export interface PeriodReport {
  total_income: number;
  total_expense: number;
  net_cashflow: number;
  transaction_count: number;
  category_summary: Record<string, number>;
  transactions: Transaction[];
}

export interface SplitSummary {
  your_share: number;
  partner_share: number;
  you_paid: number;
  partner_paid: number;
  net_balance: number;
}

export interface Settlement {
  id: string;
  household_id: string;
  from_profile_id: string;
  to_profile_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  occurred_at: string | null;
  created_at: string | null;
  from_profile: Profile | null;
  to_profile: Profile | null;
}

export interface Goal {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  status: "on-track" | "behind" | "completed";
  description: string | null;
  created_at: string | null;
}

export interface Settings {
  id: string;
  household_id: string;
  default_currency: string;
  date_format: string;
  number_format: string;
  fiscal_year_start: string;
  theme: string;
  notifications: Record<string, boolean>;
  created_at: string | null;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

let _cachedHouseholdId: string | null = null;

export function fetchHouseholds(): Promise<Household> {
  return apiFetch("/households");
}

export async function fetchHouseholdId(): Promise<string> {
  if (_cachedHouseholdId) return _cachedHouseholdId;
  const h = await apiFetch<Household>("/households");
  _cachedHouseholdId = h.id;
  return _cachedHouseholdId;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/summary");
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export function fetchTransactions(params?: {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  account_id?: string;
  category_id?: string;
}): Promise<PaginatedTransactions> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  if (params?.account_id) qs.set("account_id", params.account_id);
  if (params?.category_id) qs.set("category_id", params.category_id);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/transactions${query}`);
}

export interface SplitInPayload {
  profile_id: string;
  share_amount: number;
  share_percent?: number;
  paid_amount?: number;
}

export interface CreateTransactionPayload {
  household_id: string;
  account_id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  occurred_at: string;
  merchant?: string;
  description?: string;
  category_id?: string;
  status?: string;
  currency?: string;
  created_by_profile_id?: string;
  splits?: SplitInPayload[];
}

export function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return apiFetch("/transactions", { method: "POST", body: JSON.stringify(payload) });
}

export interface CreateTransferPayload {
  household_id: string;
  from_account_id: string;
  to_account_id: string;
  title?: string;
  amount: number;
  currency?: string;
  occurred_at: string;
  status?: string;
  created_by_profile_id?: string;
}

export interface TransferResult {
  from_transaction: Transaction;
  to_transaction: Transaction;
}

export function createTransfer(payload: CreateTransferPayload): Promise<TransferResult> {
  return apiFetch("/transactions/transfer", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateTransactionPayload {
  title?: string;
  description?: string;
  merchant?: string;
  category_id?: string;
  status?: string;
  amount?: number;
  type?: string;
  occurred_at?: string;
}

export function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
  return apiFetch(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteTransaction(id: string): Promise<{ deleted_ids: string[] }> {
  return apiFetch(`/transactions/${id}`, { method: "DELETE" });
}

// Uses raw fetch (not apiFetch) — multipart uploads must NOT set a
// Content-Type header manually; the browser sets the boundary itself.
export async function uploadReceipt(transactionId: string, file: File): Promise<Transaction> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${BASE_URL}/transactions/${transactionId}/receipt`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export function deleteReceipt(transactionId: string): Promise<Transaction> {
  return apiFetch(`/transactions/${transactionId}/receipt`, { method: "DELETE" });
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function importTransactionsCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${BASE_URL}/transactions/import`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function fetchAccounts(): Promise<Account[]> {
  return apiFetch("/accounts");
}

export function updateAccountBalance(id: string, balance: number): Promise<Account> {
  return apiFetch(`/accounts/${id}/balance`, { method: "PATCH", body: JSON.stringify({ balance }) });
}

export interface CreateAccountPayload {
  household_id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "cash" | "investment";
  currency?: string;
  opening_balance?: number;
  external_id?: string;
}

export function createAccount(payload: CreateAccountPayload): Promise<Account> {
  return apiFetch("/accounts", { method: "POST", body: JSON.stringify(payload) });
}

export function deleteAccount(id: string): Promise<void> {
  return apiFetch(`/accounts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function fetchCategories(params?: { is_income?: boolean }): Promise<Category[]> {
  const qs = new URLSearchParams();
  if (params?.is_income !== undefined) qs.set("is_income", String(params.is_income));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/categories${query}`);
}

export function createCategory(payload: {
  household_id?: string;
  name: string;
  parent_id?: string;
  is_income?: boolean;
}): Promise<Category> {
  return apiFetch("/categories", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCategory(
  id: string,
  payload: { name?: string; parent_id?: string; is_income?: boolean }
): Promise<Category> {
  return apiFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export function fetchBudgets(): Promise<Budget[]> {
  return apiFetch("/budgets");
}

export interface CreateBudgetPayload {
  household_id: string;
  name: string;
  amount: number;
  period_type: string;
  category_id?: string;
  carry_over?: boolean;
  start_date?: string;
}

export function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  return apiFetch("/budgets", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateBudgetPayload {
  name?: string;
  amount?: number;
  period_type?: string;
  category_id?: string;
  carry_over?: boolean;
  start_date?: string;
}

export function updateBudget(id: string, payload: UpdateBudgetPayload): Promise<Budget> {
  return apiFetch(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteBudget(id: string): Promise<void> {
  return apiFetch(`/budgets/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------

export function fetchInvestments(): Promise<Investment[]> {
  return apiFetch("/investments");
}

export interface CreateInvestmentPayload {
  household_id?: string;
  name: string;
  instrument?: "stock" | "etf" | "mutual_fund" | "crypto" | "bond" | "gold";
  account_id?: string;
}

export function createInvestment(payload: CreateInvestmentPayload): Promise<Investment> {
  return apiFetch("/investments", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateInvestmentPayload {
  name?: string;
  instrument?: string;
  account_id?: string;
}

export function updateInvestment(id: string, payload: UpdateInvestmentPayload): Promise<Investment> {
  return apiFetch(`/investments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteInvestment(id: string): Promise<void> {
  return apiFetch(`/investments/${id}`, { method: "DELETE" });
}

export interface CreateInvestmentTransactionPayload {
  txn_type: "buy" | "sell" | "dividend";
  units?: number;
  price_per_unit?: number;
  fees?: number;
  currency?: string;
  occurred_at: string;
}

export function createInvestmentTransaction(
  investmentId: string,
  payload: CreateInvestmentTransactionPayload
): Promise<Investment> {
  return apiFetch(`/investments/${investmentId}/transactions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInvestmentTransaction(investmentId: string, txnId: string): Promise<Investment> {
  return apiFetch(`/investments/${investmentId}/transactions/${txnId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Recurring rules
// ---------------------------------------------------------------------------

export function fetchRecurringRules(): Promise<RecurringRule[]> {
  return apiFetch("/recurring");
}

export interface CreateRecurringPayload {
  household_id: string;
  freq: string;
  title: string;
  amount: number;
  type: string;
  account_id?: string;
  category_id?: string;
  next_run_at?: string;
  is_active?: boolean;
}

export function createRecurringRule(payload: CreateRecurringPayload): Promise<RecurringRule> {
  return apiFetch("/recurring", { method: "POST", body: JSON.stringify(payload) });
}

export function updateRecurringRule(id: string, payload: { is_active?: boolean; freq?: string }): Promise<RecurringRule> {
  return apiFetch(`/recurring/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteRecurringRule(id: string): Promise<void> {
  return apiFetch(`/recurring/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function fetchSplitSummary(): Promise<SplitSummary> {
  return apiFetch("/analytics/splits");
}

export interface PartnerBalance {
  profile_id: string;
  profile_name: string;
  your_share: number;
  you_paid: number;
  net_balance: number;
}

export function fetchBalancesByPartner(): Promise<PartnerBalance[]> {
  return apiFetch("/analytics/balances");
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function fetchPeriodReport(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<PeriodReport> {
  const qs = new URLSearchParams();
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/reports/period${query}`);
}

export interface NetWorthSnapshot {
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface NetWorthReport {
  history: NetWorthSnapshot[];
  current_total_assets: number;
  current_total_liabilities: number;
  current_net_worth: number;
}

export function fetchNetWorthHistory(): Promise<NetWorthReport> {
  return apiFetch("/reports/networth");
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string | null;
  action_href: string | null;
}

export function fetchInsights(): Promise<Insight[]> {
  return apiFetch("/insights");
}

export interface Alert {
  id: string;
  severity: "error" | "warning" | "info" | "success";
  title: string;
  body: string;
  href: string;
}

export function fetchAlerts(): Promise<Alert[]> {
  return apiFetch("/insights/alerts");
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export function fetchProfiles(): Promise<Profile[]> {
  return apiFetch("/profiles");
}

// Named "household member" (not "profile") to avoid colliding with
// updateProfile() above, which edits the logged-in user's own name.
export function createHouseholdMember(payload: {
  household_id: string;
  name: string;
  email?: string;
  default_share?: number;
  is_owner?: boolean;
}): Promise<Profile> {
  return apiFetch("/profiles", { method: "POST", body: JSON.stringify(payload) });
}

export function updateHouseholdMember(
  id: string,
  payload: { name?: string; email?: string; default_share?: number; is_owner?: boolean }
): Promise<Profile> {
  return apiFetch(`/profiles/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteHouseholdMember(id: string): Promise<void> {
  return apiFetch(`/profiles/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export function fetchSettlements(): Promise<Settlement[]> {
  return apiFetch("/settlements");
}

export interface CreateSettlementPayload {
  household_id: string;
  from_profile_id: string;
  to_profile_id: string;
  amount: number;
  method?: string;
  note?: string;
  occurred_at?: string;
}

export function createSettlement(payload: CreateSettlementPayload): Promise<Settlement> {
  return apiFetch("/settlements", { method: "POST", body: JSON.stringify(payload) });
}

export function deleteSettlement(id: string): Promise<void> {
  return apiFetch(`/settlements/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export function fetchGoals(): Promise<Goal[]> {
  return apiFetch("/goals");
}

export interface CreateGoalPayload {
  household_id: string;
  name: string;
  category?: string;
  target_amount: number;
  current_amount?: number;
  monthly_contribution?: number;
  target_date?: string;
  description?: string;
}

export function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  return apiFetch("/goals", { method: "POST", body: JSON.stringify(payload) });
}

export interface UpdateGoalPayload {
  name?: string;
  category?: string;
  target_amount?: number;
  monthly_contribution?: number;
  target_date?: string;
  description?: string;
  status?: "on-track" | "behind" | "completed";
}

export function updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
  return apiFetch(`/goals/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteGoal(id: string): Promise<void> {
  return apiFetch(`/goals/${id}`, { method: "DELETE" });
}

export function contributeToGoal(id: string, amount: number): Promise<Goal> {
  return apiFetch(`/goals/${id}/contribute`, { method: "PATCH", body: JSON.stringify({ amount }) });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function fetchSettings(): Promise<Settings> {
  return apiFetch("/settings");
}

export interface UpdateSettingsPayload {
  default_currency?: string;
  date_format?: string;
  number_format?: string;
  fiscal_year_start?: string;
  theme?: string;
  notifications?: Record<string, boolean>;
}

export function updateSettings(payload: UpdateSettingsPayload): Promise<Settings> {
  return apiFetch("/settings", { method: "PUT", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string | null;
  totp_enabled: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export function checkAuthExists(email?: string): Promise<{ exists: boolean }> {
  const qs = email ? `?email=${encodeURIComponent(email)}` : "";
  return apiFetch(`/auth/exists${qs}`);
}

export function register(payload: RegisterPayload): Promise<User> {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export interface LoginPayload {
  email: string;
  password: string;
  totp_code?: string;
}

export interface LoginResult {
  access_token: string;
  requires_totp: boolean;
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export function fetchMe(): Promise<User> {
  return apiFetch("/auth/me");
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify(payload) });
}

export interface AuthSession {
  id: string;
  device: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string | null;
  last_seen_at: string | null;
  is_current: boolean;
}

export function fetchSessions(): Promise<AuthSession[]> {
  return apiFetch("/auth/sessions");
}

export function revokeSession(id: string): Promise<void> {
  return apiFetch(`/auth/sessions/${id}`, { method: "DELETE" });
}

export function revokeOtherSessions(): Promise<void> {
  return apiFetch("/auth/sessions/revoke-others", { method: "POST" });
}

export interface TwoFASetup {
  secret: string;
  provisioning_uri: string;
  qr_code_base64: string;
}

export function setup2FA(): Promise<TwoFASetup> {
  return apiFetch("/auth/2fa/setup", { method: "POST" });
}

export function verify2FA(code: string): Promise<void> {
  return apiFetch("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ code }) });
}

export function disable2FA(code: string): Promise<void> {
  return apiFetch("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code }) });
}

export function updateProfile(payload: { name?: string }): Promise<User> {
  return apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteAccountPermanently(): Promise<void> {
  await apiFetch<void>("/auth/me", { method: "DELETE" });
  clearToken();
}

export function deleteAllTransactions(): Promise<void> {
  return apiFetch("/transactions", { method: "DELETE" });
}
